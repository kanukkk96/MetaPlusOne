import { Entity } from '@xrengine/engine/src/ecs/classes/Entity'
import { addComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { createEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { TransformControls } from '@xrengine/engine/src/scene/classes/TransformGizmo'
import { NameComponent } from '@xrengine/engine/src/scene/components/NameComponent'
import { Object3DComponent } from '@xrengine/engine/src/scene/components/Object3DComponent'
import { TransformGizmoComponent } from '@xrengine/engine/src/scene/components/TransformGizmoComponent'

export const createGizmoEntity = (gizmo: TransformControls): Entity => {
  const entity = createEntity()
  addComponent(entity, Object3DComponent, { value: gizmo })
  addComponent(entity, NameComponent, { name: 'Transform Gizmo Component' })
  addComponent(entity, TransformGizmoComponent, {})
  return entity
}
