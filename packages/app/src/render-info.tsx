import React, { useContext } from 'react'
import { Observable } from 'rxjs'
import styles from './render-info.module.scss'
import {
  Cursor,
  Entity,
  EntityId,
  ItemType,
  Task,
} from './types.js'
import { ViewContext } from './view-context.js'
import { BuildView, ViewType } from './view.js'

interface RenderOutputProps {
  cursor: Cursor
  entity: Entity
}
function RenderOutput({
  cursor,
  entity,
}: RenderOutputProps) {
  if (Object.keys(entity.state.output).length === 0) {
    return <div>Output: None</div>
  }
  return (
    <>
      <div>Output:</div>
      {Object.entries(entity.state.output).map(
        ([key, value]) => {
          const itemType = ItemType.parse(key)
          return (
            <div key={key}>
              {`${itemType}: ${Math.floor(value)} [Inventory: ${Math.floor(cursor.inventory[itemType] ?? 0)}]`}
            </div>
          )
        },
      )}
    </>
  )
}

interface RenderInputProps {
  cursor: Cursor
  entity: Entity
}
function RenderInput({ cursor, entity }: RenderInputProps) {
  if (Object.keys(entity.state.input).length === 0) {
    return <div>Input: None</div>
  }
  return (
    <>
      <div>Input:</div>
      {Object.entries(entity.state.input).map(
        ([key, value]) => {
          const itemType = ItemType.parse(key)
          return (
            <div key={key}>
              {`${itemType}: ${Math.floor(value)} [Inventory: ${Math.floor(cursor.inventory[itemType] ?? 0)}]`}
            </div>
          )
        },
      )}
    </>
  )
}

interface RenderEntityInfoProps {
  cursor: Cursor
  entity: Entity
}

// eslint-disable-next-line
function RenderEntityInfo({
  cursor,
  entity,
}: RenderEntityInfoProps) {
  return (
    <>
      <div>{entity.type}</div>
      <RenderInput cursor={cursor} entity={entity} />
      <RenderOutput cursor={cursor} entity={entity} />
    </>
  )
}

interface RenderDefaultInfoProps {
  cursor: Cursor
}

function RenderDefaultInfo({
  cursor,
}: RenderDefaultInfoProps) {
  return (
    <>
      <div>
        Inventory:{' '}
        {Object.keys(cursor.inventory).length === 0 &&
          'None'}
        {Object.entries(cursor.inventory)
          .map(([key, value]) => {
            const itemType = ItemType.parse(key)
            return `${value} ${itemType}`
          })
          .join(', ')}
      </div>
    </>
  )
}

interface RenderBuildInfoProps {
  view: BuildView
}
function RenderBuildInfo({ view }: RenderBuildInfoProps) {
  return (
    <>
      <div>Input</div>
      <pre>{JSON.stringify(view.input)}</pre>
      <div>Output</div>
      <pre>{JSON.stringify(view.output)}</pre>
    </>
  )
}

export interface RenderInfoProps {
  debris$: Observable<EntityId>
  task: Task
  cursor: Cursor
  cursorEntity: Entity | null
}

const ENABLE_INFO: boolean = false

export const RenderInfo = React.memo(function RenderInfo({
  task,
  cursor,
  cursorEntity,
}: RenderInfoProps) {
  const { view } = useContext(ViewContext)

  if (task) {
    return (
      <div className={styles.task}>
        <span>Mine</span>
        <span>{task.count}</span>
        <span>{task.itemType}</span>
      </div>
    )
  }

  if (!ENABLE_INFO) return null

  return (
    <div className={styles.info}>
      {(() => {
        switch (view.type) {
          case ViewType.enum.Build:
            return <RenderBuildInfo view={view} />
        }
        if (!cursorEntity) {
          return <RenderDefaultInfo cursor={cursor} />
        }
        return (
          <RenderEntityInfo
            cursor={cursor}
            entity={cursorEntity}
          />
        )
      })()}
    </div>
  )
})
