import { createState } from '@hookstate/core'
import React, { useEffect, useState } from 'react'

import { UserAvatar } from '@xrengine/common/src/interfaces/UserAvatar'
import { AvatarEffectComponent } from '@xrengine/engine/src/avatar/components/AvatarEffectComponent'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { WidgetAppService } from '@xrengine/engine/src/xrui/WidgetAppService'
import { WidgetName } from '@xrengine/engine/src/xrui/Widgets'

import { ArrowBackIos, ArrowForwardIos, Check, PersonAdd } from '@mui/icons-material'

import { AuthService, useAuthState } from '../../../user/services/AuthService'
import XRIconButton from '../../components/XRIconButton'
import styleString from './index.scss'

export function createSelectAvatarMenu() {
  return createXRUI(SelectAvatarMenu, createSelectAvatarMenuState())
}

function createSelectAvatarMenuState() {
  return createState({})
}

const SelectAvatarMenu = () => {
  const MAX_AVATARS_PER_PAGE = window.innerWidth >= 1024 ? 9 : 12
  const MIN_AVATARS_PER_PAGE = 6
  const getAvatarPerPage = () => (window.innerWidth > 768 ? MAX_AVATARS_PER_PAGE : MIN_AVATARS_PER_PAGE)
  const authState = useAuthState()
  const avatarId = authState.user?.avatarId?.value
  const avatarList = authState.avatarList.value

  const userSettings = authState.user.user_setting.value
  const [page, setPage] = useState(0)
  const [imgPerPage, setImgPerPage] = useState(getAvatarPerPage())
  const [selectedAvatar, setSelectedAvatar] = useState<any>('')

  useEffect(() => {
    AuthService.fetchAvatarList()
  }, [])

  useEffect(() => {
    if (page * imgPerPage >= authState.avatarList.value.length) {
      if (page === 0) return
      setPage(page - 1)
    }
  }, [authState.avatarList.value])

  const setAvatar = (avatarId: string, avatarURL: string, thumbnailURL: string) => {
    if (hasComponent(Engine.instance.currentWorld.localClientEntity, AvatarEffectComponent)) return
    if (authState.user?.value) {
      AuthService.updateUserAvatarId(authState.user.id.value!, avatarId, avatarURL, thumbnailURL)
    }
  }

  const loadNextAvatars = () => {
    if ((page + 1) * imgPerPage >= avatarList.length) return
    setPage(page + 1)
  }

  const loadPreviousAvatars = () => {
    if (page === 0) return
    setPage(page - 1)
  }

  const confirmAvatar = () => {
    if (selectedAvatar && avatarId != selectedAvatar?.avatar?.name) {
      setAvatar(
        selectedAvatar?.avatar?.name || '',
        selectedAvatar?.avatar?.url || '',
        selectedAvatar['user-thumbnail']?.url || ''
      )
      WidgetAppService.setWidgetVisibility(WidgetName.PROFILE, false)
    }
    setSelectedAvatar('')
  }

  const selectAvatar = (avatarResources: UserAvatar) => {
    setSelectedAvatar(avatarResources)
  }

  const openAvatarSelectMenu = (e) => {
    WidgetAppService.setWidgetVisibility(WidgetName.UPLOAD_AVATAR, true)
  }

  const renderAvatarList = () => {
    const avatarElementList = [] as JSX.Element[]
    const startIndex = page * imgPerPage
    const endIndex = Math.min(startIndex + imgPerPage, avatarList.length)
    let index = 0
    for (let i = startIndex; i < endIndex; i++, index++) {
      const characterAvatar = avatarList[i]!
      const avatar = characterAvatar.avatar!

      avatarElementList.push(
        <div
          key={avatar.id}
          xr-layer="true"
          onClick={() => selectAvatar(characterAvatar)}
          className={`paperAvatar ${avatar.name == selectedAvatar?.avatar?.name ? 'selectedAvatar' : ''}
              ${avatar.name == avatarId ? 'activeAvatar' : ''}`}
          style={{
            pointerEvents: avatar.name == avatarId ? 'none' : 'auto',
            height: '140px',
            width: '170px',
            boxShadow: 'none',
            backgroundColor: 'var(--mainBackground)'
          }}
        >
          <img
            className="avatar"
            crossOrigin="anonymous"
            src={characterAvatar['user-thumbnail']?.url || ''}
            alt={avatar.name}
          />
        </div>
      )
    }

    return avatarElementList
  }

  return (
    <>
      <style>{styleString}</style>
      <div className="avatarSelectContainer">
        <div className="avatarContainer">
          <div className="gridContainer" style={{ margin: 0 }}>
            {renderAvatarList()}
          </div>
        </div>
        <div className="menuContainer">
          <XRIconButton
            xr-layer="true"
            onClick={loadPreviousAvatars}
            disabled={page === 0}
            content={<ArrowBackIos className="size" />}
          />
          <div className="innerMenuContainer">
            <XRIconButton
              xr-layer="true"
              backgroundColor="#f87678"
              onClick={() => {
                setSelectedAvatar('')
              }}
              disabled={!selectedAvatar}
              content={<span style={{ fontSize: '15px', fontWeight: 'bold' }}>X</span>}
            />
            <XRIconButton
              xr-layer="true"
              backgroundColor="#23af3a"
              onClick={confirmAvatar}
              disabled={selectedAvatar?.avatar?.name == avatarId}
              content={<Check />}
            />
            <XRIconButton
              xr-layer="true"
              backgroundColor="rgb(255 255 255 / 70%)"
              onClick={openAvatarSelectMenu}
              content={<PersonAdd className="size" />}
            />
          </div>
          <XRIconButton
            xr-layer="true"
            onClick={loadNextAvatars}
            disabled={(page + 1) * imgPerPage >= avatarList.length}
            content={<ArrowForwardIos className="size" />}
          />
        </div>
      </div>
    </>
  )
}

export default SelectAvatarMenu