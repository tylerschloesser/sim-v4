import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  buildMiner,
  buildSmelter,
  minePatch,
  moveItemFromCursorToMiner,
  moveItemFromCursorToSmelter,
  takeAllFromMiner,
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
  MinerEntity,
  PatchEntity,
  SmelterEntity,
  World,
} from './world.js'

export interface RenderControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
  entity: Entity | null
  entityInventory: Inventory | null
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
            onTap={() => {
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
            onTap={() => {
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
      case EntityType.enum.Miner:
        invariant(entityInventory)
        return (
          <RenderMinerControls
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
  onTap?(): void
  onHold?(): void
}>

function RenderPrimaryButton({
  disabled = false,
  onTap,
  onHold,
  children,
}: ButtonProps) {
  invariant(!onTap || !onHold)

  const [pointerDown, setPointerDown] = useState(false)
  const interval = useRef<number>()

  useEffect(() => {
    self.clearInterval(interval.current)
    if (pointerDown) {
      interval.current = self.setInterval(() => {
        invariant(onHold)
        onHold()
      }, 250)
    }
  }, [pointerDown, onHold])

  return (
    <button
      className={styles['primary-button']}
      data-pointer="capture"
      onPointerCancel={
        onHold
          ? () => {
              setPointerDown(false)
            }
          : undefined
      }
      onPointerLeave={
        onHold
          ? () => {
              setPointerDown(false)
            }
          : undefined
      }
      onPointerUp={
        onHold
          ? () => {
              setPointerDown(false)
            }
          : onTap
      }
      onPointerDown={
        onHold
          ? () => {
              setPointerDown(true)
            }
          : undefined
      }
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function RenderSecondaryButton({
  disabled = false,
  onTap,
  children,
}: ButtonProps) {
  return (
    <button
      className={styles['secondary-button']}
      data-pointer="capture"
      onPointerUp={onTap}
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

  const mine = useCallback(() => {
    minePatch(setWorld)
  }, [])

  return (
    <>
      <RenderPrimaryButton onHold={mine}>
        Mine
      </RenderPrimaryButton>

      {inventoryHas(cursorInventory, minerRecipe.input) && (
        <RenderSecondaryButton
          onTap={() => {
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

  const availableRecipes =
    getAvailableEntityRecipes(cursorInventory)

  const recipe = availableRecipes.at(0)
  const disabled = !recipe

  const onTap = () => {
    if (!recipe) return
    const camera = camera$.value
    buildSmelter(setWorld, vec2.clone(camera.position))
  }

  return (
    <RenderPrimaryButton disabled={disabled} onTap={onTap}>
      Build {recipe?.id}
    </RenderPrimaryButton>
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

  const outputType = ItemType.enum.IronPlate
  const hasOutput =
    (entityInventory.items[outputType] ?? 0) > 0
  const coalCount =
    entityInventory.items[ItemType.enum.Coal] ?? 0
  const hasCoal =
    (cursorInventory.items[ItemType.enum.Coal] ?? 0) > 0
  const hasIronOre =
    (cursorInventory.items[ItemType.enum.IronOre] ?? 0) > 0

  const addCoal = useCallback(() => {
    if (!hasCoal) return
    moveItemFromCursorToSmelter(
      setWorld,
      ItemType.enum.Coal,
    )
  }, [hasCoal])

  const addIronOre = useCallback(() => {
    if (!hasIronOre) return
    moveItemFromCursorToSmelter(
      setWorld,
      ItemType.enum.IronOre,
    )
  }, [hasIronOre])

  return (
    <>
      <RenderSecondaryButton
        disabled={!hasOutput}
        onTap={() => {
          if (!hasOutput) return
          takeAllFromSmelter(setWorld)
        }}
      >
        Take All
      </RenderSecondaryButton>
      {coalCount < 5 && hasCoal ? (
        <RenderPrimaryButton onTap={addCoal}>
          Add Coal
        </RenderPrimaryButton>
      ) : (
        <RenderPrimaryButton
          disabled={!hasIronOre}
          onHold={addIronOre}
        >
          Add Iron Ore
        </RenderPrimaryButton>
      )}
    </>
  )
}

interface RenderMinerControlsProps {
  cursorInventory: Inventory
  setWorld: Updater<World>
  entity: MinerEntity
  entityInventory: Inventory
}

function RenderMinerControls({
  cursorInventory,
  setWorld,
  entity,
  entityInventory,
}: RenderMinerControlsProps) {
  invariant(entity?.type === EntityType.enum.Miner)
  invariant(entityInventory?.id === entity.inventoryId)

  return (
    <>
      {(() => {
        const { itemType } = entity
        const hasOutput =
          (entityInventory.items[itemType] ?? 0) > 0

        return (
          <RenderSecondaryButton
            disabled={!hasOutput}
            onTap={() => {
              if (!hasOutput) return
              takeAllFromMiner(setWorld)
            }}
          >
            Take All
          </RenderSecondaryButton>
        )
      })()}
      {(() => {
        const hasCoal =
          (cursorInventory.items[ItemType.enum.Coal] ?? 0) >
          0

        return (
          <RenderPrimaryButton
            disabled={!hasCoal}
            onTap={() => {
              if (!hasCoal) return
              moveItemFromCursorToMiner(
                setWorld,
                ItemType.enum.Coal,
              )
            }}
          >
            Add Coal
          </RenderPrimaryButton>
        )
      })()}
    </>
  )
}
