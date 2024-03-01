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
  connectMinerToPatch,
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
import {
  RouteId,
  useConnectEntityId,
  usePatchId,
  useRouteId,
} from './route.js'
import { vec2 } from './vec2.js'
import {
  Cursor,
  Entity,
  EntityType,
  ItemType,
  MinerEntity,
  PatchEntity,
  SmelterEntity,
  World,
} from './world.js'

export interface RenderControlsProps {
  cursor: Cursor
  cursorEntity: Entity | null
  setWorld: Updater<World>
  buildValid: boolean | null
  connectValid: boolean | null
}

export const RenderControls = React.memo(
  function RenderControls({
    cursor,
    cursorEntity,
    setWorld,
    buildValid,
    connectValid,
  }: RenderControlsProps) {
    const navigate = useNavigate()
    const { camera$ } = useContext(AppContext)

    const routeId = useRouteId()
    const patchId = usePatchId()
    const connectEntityId = useConnectEntityId()

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

    if (routeId === RouteId.enum.Connect) {
      return (
        <>
          <RenderPrimaryButton
            disabled={connectValid !== true}
            onTap={() => {
              if (connectValid !== true) return
              invariant(connectEntityId)
              connectMinerToPatch(setWorld, connectEntityId)
            }}
          >
            Connect
          </RenderPrimaryButton>
          <RenderSecondaryButton
            onTap={() => {
              navigate('..')
            }}
          >
            Cancel
          </RenderSecondaryButton>
        </>
      )
    }

    if (cursorEntity) {
      switch (cursorEntity?.type) {
        case EntityType.enum.Patch:
          return (
            <RenderPatchControls
              cursor={cursor}
              entity={cursorEntity}
              setWorld={setWorld}
            />
          )
        case EntityType.enum.Smelter:
          return (
            <RenderSmelterControls
              cursor={cursor}
              entity={cursorEntity}
              setWorld={setWorld}
            />
          )
        case EntityType.enum.Miner:
          return (
            <RenderMinerControls
              cursor={cursor}
              entity={cursorEntity}
              setWorld={setWorld}
            />
          )
        default:
          invariant(false)
      }
    }

    return (
      <RenderDefaultControls
        cursor={cursor}
        setWorld={setWorld}
      />
    )
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
  const holdCount = useRef<number>(0)

  useEffect(() => {
    holdCount.current = 0
    self.clearInterval(interval.current)
    if (pointerDown) {
      interval.current = self.setInterval(() => {
        invariant(onHold)
        onHold()
        holdCount.current += 1
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
              if (holdCount.current === 0) {
                // if we haven't triggered via hold yet,
                // consider this a tap
                onHold()
              }
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

// eslint-disable-next-line
function RenderTertiaryButton({
  disabled = false,
  onTap,
  children,
}: ButtonProps) {
  return (
    <button
      className={styles['tertiary-button']}
      data-pointer="capture"
      onPointerUp={onTap}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface RenderPatchControlsProps {
  cursor: Cursor
  entity: PatchEntity
  setWorld: Updater<World>
}

function RenderPatchControls({
  cursor,
  entity,
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

      {inventoryHas(
        cursor.inventory,
        minerRecipe.input,
      ) && (
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
  cursor: Cursor
  setWorld: Updater<World>
}

function RenderDefaultControls({
  cursor,
  setWorld,
}: RenderDefaultControlsProps) {
  const { camera$ } = useContext(AppContext)

  const availableRecipes = getAvailableEntityRecipes(
    cursor.inventory,
  )

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
  cursor: Cursor
  entity: SmelterEntity
  setWorld: Updater<World>
}

function RenderSmelterControls({
  cursor,
  entity,
  setWorld,
}: RenderSmelterControlsProps) {
  const outputType = ItemType.enum.IronPlate
  const hasOutput =
    (entity.state.output[outputType] ?? 0) > 0
  const coalCount =
    entity.state.input[ItemType.enum.Coal] ?? 0
  const hasCoal =
    (cursor.inventory[ItemType.enum.Coal] ?? 0) > 0
  const hasIronOre =
    (cursor.inventory[ItemType.enum.IronOre] ?? 0) > 0

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
        <RenderPrimaryButton onHold={addCoal}>
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
  cursor: Cursor
  entity: MinerEntity
  setWorld: Updater<World>
}

function RenderMinerControls({
  cursor,
  entity,
  setWorld,
}: RenderMinerControlsProps) {
  const outputType = (() => {
    const first = Object.keys(entity.state.output)
    return first ? ItemType.parse(first) : null
  })()

  const hasOutput = outputType !== null
  const hasCoal =
    (cursor.inventory[ItemType.enum.Coal] ?? 0) > 0

  const addCoal = useCallback(() => {
    if (!hasCoal) return
    moveItemFromCursorToMiner(setWorld, ItemType.enum.Coal)
  }, [hasCoal])

  const navigate = useNavigate()

  return (
    <>
      <RenderSecondaryButton
        disabled={!hasOutput}
        onTap={() => {
          if (!hasOutput) return
          takeAllFromMiner(setWorld)
        }}
      >
        Take All
      </RenderSecondaryButton>
      {entity.shape.patchId ? (
        <RenderPrimaryButton
          disabled={!hasCoal}
          onHold={addCoal}
        >
          Add Coal
        </RenderPrimaryButton>
      ) : (
        <RenderPrimaryButton
          onTap={() => {
            navigate(`connect?entityId=${entity.id}`)
          }}
        >
          Connect
        </RenderPrimaryButton>
      )}
    </>
  )
}
