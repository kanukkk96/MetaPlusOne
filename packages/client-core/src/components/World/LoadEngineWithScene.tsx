import React, { useState } from 'react'
import { useHistory } from 'react-router'

import { LocationInstanceConnectionServiceReceptor } from '@xrengine/client-core/src/common/services/LocationInstanceConnectionService'
import { LocationService } from '@xrengine/client-core/src/social/services/LocationService'
import { leaveNetwork } from '@xrengine/client-core/src/transports/SocketWebRTCClientFunctions'
import { AuthService, useAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import {
  SceneActions,
  SceneServiceReceptor,
  useSceneState
} from '@xrengine/client-core/src/world/services/SceneService'
import multiLogger from '@xrengine/common/src/logger'
import { getSearchParamFromURL } from '@xrengine/common/src/utils/getSearchParamFromURL'
import { SpawnPoints } from '@xrengine/engine/src/avatar/AvatarSpawnSystem'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions, useEngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { spawnLocalAvatarInWorld } from '@xrengine/engine/src/networking/functions/receiveJoinWorld'
import { teleportToScene } from '@xrengine/engine/src/scene/functions/teleportToScene'
import { addActionReceptor, dispatchAction, removeActionReceptor, useHookEffect } from '@xrengine/hyperflux'

import { AppAction, GeneralStateList } from '../../common/services/AppService'
import { SocketWebRTCClientNetwork } from '../../transports/SocketWebRTCClientNetwork'
import { initClient, loadScene } from './LocationLoadHelper'

const logger = multiLogger.child({ component: 'client-core:world' })

export const LoadEngineWithScene = () => {
  const history = useHistory()
  const engineState = useEngineState()
  const sceneState = useSceneState()
  const authState = useAuthState()
  const [clientReady, setClientReady] = useState(false)

  /**
   * initialise the client
   */
  useHookEffect(() => {
    initClient().then(() => {
      setClientReady(true)
    })

    addActionReceptor(SceneServiceReceptor)
    addActionReceptor(LocationInstanceConnectionServiceReceptor)

    return () => {
      removeActionReceptor(SceneServiceReceptor)
      removeActionReceptor(LocationInstanceConnectionServiceReceptor)
    }
  }, [])

  /**
   * load the scene whenever it changes
   */
  useHookEffect(() => {
    const sceneData = sceneState.currentScene.value
    if (clientReady && sceneData) {
      AuthService.fetchAvatarList()
      dispatchAction(AppAction.setAppOnBoardingStep({ onBoardingStep: GeneralStateList.SCENE_LOADING }))
      loadScene(sceneData).then(() => {
        dispatchAction(AppAction.setAppOnBoardingStep({ onBoardingStep: GeneralStateList.SCENE_LOADED }))
      })
    }
  }, [clientReady, sceneState.currentScene])

  useHookEffect(async () => {
    if (
      engineState.joinedWorld.value ||
      !engineState.sceneLoaded.value ||
      !authState.user.value ||
      getSearchParamFromURL('spectate')
    )
      return
    const user = authState.user.value
    const avatarDetails = authState.avatarList.value.find((avatar) => avatar.avatar?.name === user.avatarId)!
    const spawnPoint = getSearchParamFromURL('spawnPoint')
    let avatarSpawnPose
    if (spawnPoint) avatarSpawnPose = SpawnPoints.instance.getSpawnPoint(spawnPoint)
    else avatarSpawnPose = SpawnPoints.instance.getRandomSpawnPoint()
    spawnLocalAvatarInWorld({
      avatarSpawnPose,
      avatarDetail: {
        avatarURL: avatarDetails.avatar?.url!,
        thumbnailURL: avatarDetails['user-thumbnail']?.url!
      },
      name: user.name
    })
  }, [engineState.sceneLoaded, authState.user, engineState.joinedWorld])

  useHookEffect(() => {
    if (engineState.joinedWorld.value) {
      if (engineState.isTeleporting.value) {
        // if we are coming from another scene, reset our teleporting status
        dispatchAction(EngineActions.setTeleporting({ isTeleporting: false }))
      } else {
        dispatchAction(AppAction.setAppOnBoardingStep({ onBoardingStep: GeneralStateList.SUCCESS }))
        dispatchAction(AppAction.setAppLoaded({ loaded: true }))
      }
    }
  }, [engineState.joinedWorld])

  useHookEffect(() => {
    if (engineState.isTeleporting.value) {
      // TODO: this needs to be implemented on the server too
      // Use teleportAvatar function from moveAvatar.ts when required
      // if (slugifiedNameOfCurrentLocation === portalComponent.location) {
      //   teleportAvatar(
      //     useWorld().localClientEntity,
      //     portalComponent.remoteSpawnPosition,
      //     portalComponent.remoteSpawnRotation
      //   )
      //   return
      // }

      logger.info('Resetting connection for portal teleport.')

      const world = Engine.instance.currentWorld

      dispatchAction(SceneActions.unloadCurrentScene())
      history.push('/location/' + world.activePortal.location)
      LocationService.getLocationByName(world.activePortal.location, authState.user.id.value)

      // shut down connection with existing world instance server
      // leaving a world instance server will check if we are in a location media instance and shut that down too
      leaveNetwork(world.worldNetwork as SocketWebRTCClientNetwork)

      teleportToScene()
    }
  }, [engineState.isTeleporting])

  return <></>
}
