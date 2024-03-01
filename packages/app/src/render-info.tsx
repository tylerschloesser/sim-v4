import React from 'react'
import invariant from 'tiny-invariant'
import { getAvailableEntityRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { RouteId, useRouteId } from './route.js'
import {
  Cursor,
  Entity,
  EntityType,
  ItemType,
  MinerEntity,
  PatchEntity,
  SmelterEntity,
} from './world.js'

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
              {`${itemType}: ${value} [Inventory: ${cursor.inventory[itemType] ?? 0}]`}
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
              {`${itemType}: ${value} [Inventory: ${cursor.inventory[itemType] ?? 0}]`}
            </div>
          )
        },
      )}
    </>
  )
}

interface RenderPatchInfoProps {
  cursor: Cursor
  entity: PatchEntity
}

function RenderPatchInfo({
  cursor,
  entity,
}: RenderPatchInfoProps) {
  return (
    <>
      <div>Patch</div>
      <RenderOutput cursor={cursor} entity={entity} />
      <div>
        Miners: {Object.keys(entity.shape.minerIds).length}
      </div>
    </>
  )
}

interface RenderSmelterInfoProps {
  cursor: Cursor
  entity: SmelterEntity
}

function RenderSmelterInfo({
  cursor,
  entity,
}: RenderSmelterInfoProps) {
  const { state } = entity
  return (
    <>
      <div>{entity.type}</div>
      <div>
        Fuel Ticks Remaining: {state.fuelTicksRemaining}
      </div>
      <div>
        Smelt Ticks Remaining: {state.smeltTicksRemaining}
      </div>
      <RenderInput cursor={cursor} entity={entity} />
      <RenderOutput cursor={cursor} entity={entity} />
    </>
  )
}

interface RenderMinerInfoProps {
  cursor: Cursor
  entity: MinerEntity
}

function RenderMinerInfo({
  cursor,
  entity,
}: RenderMinerInfoProps) {
  const { state } = entity
  return (
    <>
      <div>{entity.type}</div>
      <div>
        Fuel Ticks Remaining: {state.fuelTicksRemaining}
      </div>
      <div>
        Mine Ticks Remaining: {state.mineTicksRemaining}
      </div>
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
  const availableRecipes = getAvailableEntityRecipes(
    cursor.inventory,
  )
  return (
    <>
      <div>
        Inventory:{' '}
        {Object.keys(cursor.inventory).length === 0 &&
          'None'}
        {Object.entries(cursor.inventory).map(
          ([key, value]) => {
            const itemType = ItemType.parse(key)
            return (
              <div key={key}>
                {itemType}: {value}
              </div>
            )
          },
        )}
      </div>
      <div>
        Available Recipes:{' '}
        {availableRecipes.length === 0 && 'None'}
      </div>
      {availableRecipes.map((recipe) => (
        <div key={recipe.id}>{recipe.id}</div>
      ))}
    </>
  )
}

export interface RenderInfoProps {
  cursor: Cursor
  cursorEntity: Entity | null
}

export const RenderInfo = React.memo(function RenderInfo({
  cursor,
  cursorEntity,
}: RenderInfoProps) {
  const routeId = useRouteId()
  if (routeId === RouteId.enum.BuildMiner) {
    return null
  }

  return (
    <div className={styles.info}>
      {(() => {
        if (!cursorEntity) {
          return <RenderDefaultInfo cursor={cursor} />
        }

        switch (cursorEntity.type) {
          case EntityType.enum.Patch: {
            return (
              <RenderPatchInfo
                cursor={cursor}
                entity={cursorEntity}
              />
            )
          }
          case EntityType.enum.Smelter: {
            return (
              <RenderSmelterInfo
                cursor={cursor}
                entity={cursorEntity}
              />
            )
          }
          case EntityType.enum.Miner: {
            return (
              <RenderMinerInfo
                cursor={cursor}
                entity={cursorEntity}
              />
            )
          }
          default:
            invariant(false)
        }
      })()}
    </div>
  )
})
