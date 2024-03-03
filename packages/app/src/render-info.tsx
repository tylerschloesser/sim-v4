import React, { useContext } from 'react'
import invariant from 'tiny-invariant'
import { getConnectedMinerShapes } from './patch.js'
import { getAvailableEntityRecipes } from './recipe.js'
import styles from './render-info.module.scss'
import { ViewContext } from './view-context.js'
import { ViewType } from './view.js'
import {
  CrafterEntity,
  Cursor,
  Entity,
  EntityType,
  GeneratorEntity,
  ItemType,
  MinerEntity,
  PatchEntity,
  SmelterEntity,
  World,
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
  shapes: World['shapes']
}

function RenderPatchInfo({
  cursor,
  entity,
  shapes,
}: RenderPatchInfoProps) {
  const connectedMiners = getConnectedMinerShapes(
    entity,
    shapes,
  )
  return (
    <>
      <div>Patch</div>
      <RenderOutput cursor={cursor} entity={entity} />
      <div>Miners: {connectedMiners.length}</div>
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

interface RenderGeneratorInfoProps {
  cursor: Cursor
  entity: GeneratorEntity
}

function RenderGeneratorInfo({
  cursor,
  entity,
}: RenderGeneratorInfoProps) {
  const { state } = entity
  return (
    <>
      <div>{entity.type}</div>
      <div>
        Fuel Ticks Remaining: {state.fuelTicksRemaining}
      </div>
      <RenderInput cursor={cursor} entity={entity} />
      <RenderOutput cursor={cursor} entity={entity} />
    </>
  )
}

interface RenderCrafterInfoProps {
  cursor: Cursor
  entity: CrafterEntity
}

function RenderCrafterInfo({
  cursor,
  entity,
}: RenderCrafterInfoProps) {
  const { state } = entity
  return (
    <>
      <div>{entity.type}</div>
      <div>
        Craft Ticks Remaining: {state.craftTicksRemaining}
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
        <div key={recipe.output}>{recipe.output}</div>
      ))}
    </>
  )
}

export interface RenderInfoProps {
  cursor: Cursor
  cursorEntity: Entity | null
  shapes: World['shapes']
}

export const RenderInfo = React.memo(function RenderInfo({
  cursor,
  cursorEntity,
  shapes,
}: RenderInfoProps) {
  const { view } = useContext(ViewContext)
  if (view.type === ViewType.enum.Build) {
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
                shapes={shapes}
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
          case EntityType.enum.Generator: {
            return (
              <RenderGeneratorInfo
                cursor={cursor}
                entity={cursorEntity}
              />
            )
          }
          case EntityType.enum.Crafter: {
            return (
              <RenderCrafterInfo
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
