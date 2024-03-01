import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  buildMiner,
  buildSmelter,
  minePatch,
  moveItemFromCursorToSmelter,
  takeAllFromSmelter,
} from './action.js'
import { AppContext } from './app-context.js'
import { inventoryHas } from './inventory.js'
import {
  entityRecipes,
  getAvailableEntityRecipes,
} from './recipe.js'
import styles from './render-controls.module.scss'
import { RouteId, usePatchId, useRouteId } from './route.js'
import { vec2 } from './vec2.js'
import {
  Entity,
  EntityType,
  Inventory,
  ItemType,
  PatchEntity,
  SmelterEntity,
  World,
} from './world.js'

export interface RenderControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
  entity?: Entity
  entityInventory?: Inventory
  buildValid: boolean | null
}

export const RenderControls = React.memo(
  function RenderControls({
    cursorInventory,
    setWorld,
    entity,
    entityInventory,
    buildValid,
  }: RenderControlsProps) {
    const navigate = useNavigate()
    const { camera$ } = useContext(AppContext)

    const routeId = useRouteId()
    const patchId = usePatchId()

    if (routeId === RouteId.enum.BuildMiner) {
      return (
        <>
          <RenderPrimaryButton
            disabled={buildValid !== true}
            onPointerUp={() => {
              if (buildValid !== true) return
              invariant(patchId)
              buildMiner(
                setWorld,
                vec2.clone(camera$.value.position),
                patchId,
              )
            }}
          >
            Build
          </RenderPrimaryButton>
          <RenderSecondaryButton
            onPointerUp={() => {
              navigate('..')
            }}
          >
            Back
          </RenderSecondaryButton>
        </>
      )
    }

    switch (entity?.type) {
      case EntityType.enum.Patch:
        return (
          <RenderPatchControls
            entity={entity}
            cursorInventory={cursorInventory}
            setWorld={setWorld}
          />
        )
      case EntityType.enum.Smelter:
        invariant(entityInventory)
        return (
          <RenderSmelterControls
            cursorInventory={cursorInventory}
            setWorld={setWorld}
            entity={entity}
            entityInventory={entityInventory}
          />
        )
      default:
        return (
          <RenderDefaultControls
            cursorInventory={cursorInventory}
            setWorld={setWorld}
          />
        )
    }
  },
)

type ButtonProps = React.PropsWithChildren<{
  disabled?: boolean
  onPointerUp(): void
}>

function RenderPrimaryButton({
  disabled = false,
  onPointerUp,
  children,
}: ButtonProps) {
  return (
    <button
      className={styles['primary-button']}
      data-pointer="capture"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function RenderSecondaryButton({
  disabled = false,
  onPointerUp,
  children,
}: ButtonProps) {
  return (
    <button
      className={styles['secondary-button']}
      data-pointer="capture"
      onPointerUp={onPointerUp}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface RenderPatchControlsProps {
  entity: PatchEntity
  cursorInventory: Inventory
  setWorld: Updater<World>
}

function RenderPatchControls({
  entity,
  cursorInventory,
  setWorld,
}: RenderPatchControlsProps) {
  const navigate = useNavigate()
  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  return (
    <>
      <RenderPrimaryButton
        onPointerUp={() => minePatch(setWorld)}
      >
        Mine
      </RenderPrimaryButton>

      {inventoryHas(cursorInventory, minerRecipe.input) && (
        <RenderSecondaryButton
          onPointerUp={() => {
            navigate(`build-miner?patchId=${entity.id}`)
          }}
        >
          Build Miner
        </RenderSecondaryButton>
      )}
    </>
  )
}

interface RenderDefaultControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
}

function RenderDefaultControls({
  cursorInventory,
  setWorld,
}: RenderDefaultControlsProps) {
  const { camera$ } = useContext(AppContext)

  let onPointerUp: (() => void) | undefined = undefined
  const availableRecipes =
    getAvailableEntityRecipes(cursorInventory)

  const recipe = availableRecipes.at(0)

  if (recipe) {
    onPointerUp = () => {
      const camera = camera$.value
      buildSmelter(setWorld, vec2.clone(camera.position))
    }
  }

  const disabled = onPointerUp === undefined

  return (
    <button
      className={styles['primary-button']}
      disabled={disabled}
      onPointerUp={onPointerUp}
    >
      Build {recipe?.id}
    </button>
  )
}

interface RenderSmelterControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
  entity: SmelterEntity
  entityInventory: Inventory
}

function RenderSmelterControls({
  cursorInventory,
  setWorld,
  entity,
  entityInventory,
}: RenderSmelterControlsProps) {
  invariant(entity?.type === EntityType.enum.Smelter)
  invariant(entityInventory?.id === entity.inventoryId)

  return (
    <>
      {(() => {
        const itemType = ItemType.enum.IronPlate
        const hasOutput =
          (entityInventory.items[itemType] ?? 0) > 0

        return (
          <RenderSecondaryButton
            disabled={!hasOutput}
            onPointerUp={() => {
              if (!hasOutput) return
              takeAllFromSmelter(setWorld)
            }}
          >
            Take All
          </RenderSecondaryButton>
        )
      })()}
      {(() => {
        const coalCount =
          entityInventory.items[ItemType.enum.Coal] ?? 0
        const hasCoal =
          (cursorInventory.items[ItemType.enum.Coal] ?? 0) >
          0

        if (coalCount < 5 && hasCoal) {
          return (
            <RenderPrimaryButton
              onPointerUp={() => {
                if (!hasCoal) return
                moveItemFromCursorToSmelter(
                  setWorld,
                  ItemType.enum.Coal,
                )
              }}
            >
              Add Coal
            </RenderPrimaryButton>
          )
        }
        const hasIron =
          (cursorInventory.items[ItemType.enum.IronOre] ??
            0) > 0
        return (
          <RenderPrimaryButton
            disabled={!hasIron}
            onPointerUp={() => {
              if (!hasIron) return
              moveItemFromCursorToSmelter(
                setWorld,
                ItemType.enum.IronOre,
              )
            }}
          >
            Add Iron Ore
          </RenderPrimaryButton>
        )
      })()}
    </>
  )
}
