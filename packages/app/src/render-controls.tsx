import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  addConnection,
  buildEntity,
  minePatch,
  moveFromCursorToEntityInput,
  moveFromEntityOutputToCursor,
  removeConnection,
} from './action.js'
import { AppContext } from './app-context.js'
import { inventoryHas } from './inventory.js'
import {
  entityRecipes,
  getAvailableEntityRecipes,
} from './recipe.js'
import styles from './render-controls.module.scss'
import { vec2 } from './vec2.js'
import { ViewContext } from './view-context.js'
import {
  BuildView,
  ConnectAction,
  ConnectView,
  SelectView,
  ViewType,
} from './view.js'
import {
  ConnectionType,
  Connections,
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
}

interface RenderBuildControlsProps {
  cursor: Cursor
  setWorld: Updater<World>
  view: BuildView
}

function RenderBuildControls({
  cursor,
  setWorld,
  view,
}: RenderBuildControlsProps) {
  const navigate = useNavigate()
  const setSearch = useSearchParams()[1]
  const { camera$ } = useContext(AppContext)
  const availableRecipes = getAvailableEntityRecipes(
    cursor.inventory,
  )

  return (
    <>
      <RenderPrimaryButton
        disabled={!view.valid}
        onTap={() => {
          buildEntity(
            setWorld,
            view.entityType,
            vec2.clone(camera$.value.position),
            view.connections,
          )
        }}
        label={`Build ${view.entityType}`}
      />
      <RenderSecondaryButton
        onTap={() => {
          navigate('..')
        }}
        label="Back"
      />
      <RenderTertiaryButton
        disabled={availableRecipes.length < 2}
        onTap={() => {
          let i = availableRecipes.findIndex(
            (recipe) => recipe.output === view.entityType,
          )
          invariant(i >= 0)

          i = (i + 1) % availableRecipes.length
          invariant(i < availableRecipes.length)

          const next = availableRecipes[i]
          invariant(next)

          setSearch((prev) => {
            prev.set('entityType', next.output)
            return prev
          })
        }}
        label="Recipe"
      />
    </>
  )
}

interface RenderConnectControlsProps {
  cursor: Cursor
  view: ConnectView
  setWorld: Updater<World>
}

function RenderConnectControls({
  cursor,
  view,
  setWorld,
}: RenderConnectControlsProps) {
  const navigate = useNavigate()
  return (
    <>
      <RenderPrimaryButton
        disabled={view.action === null}
        onTap={() => {
          invariant(cursor.entityId)
          if (view.action === ConnectAction.enum.Connect) {
            addConnection(
              setWorld,
              view.sourceId,
              cursor.entityId,
            )
          } else if (
            view.action === ConnectAction.enum.Disconnect
          ) {
            removeConnection(
              setWorld,
              view.sourceId,
              cursor.entityId,
            )
          }
        }}
        label={
          view.action === ConnectAction.enum.Disconnect
            ? 'Disconnect'
            : 'Connect'
        }
      />
      <RenderSecondaryButton
        onTap={() => {
          navigate('..')
        }}
        label="Cancel"
      />
    </>
  )
}

interface RenderSelectControlsProps {
  view: SelectView
}

function RenderSelectControls({
  // eslint-disable-next-line
  view,
}: RenderSelectControlsProps) {
  const navigate = useNavigate()
  return (
    <>
      <RenderPrimaryButton label="Select" />
      <RenderSecondaryButton
        onTap={() => {
          navigate('..')
        }}
        label="Cancel"
      />
    </>
  )
}

export const RenderControls = React.memo(
  function RenderControls({
    cursor,
    cursorEntity,
    setWorld,
  }: RenderControlsProps) {
    const navigate = useNavigate()
    const { view } = useContext(ViewContext)

    switch (view.type) {
      case ViewType.enum.Build: {
        return (
          <RenderBuildControls
            cursor={cursor}
            setWorld={setWorld}
            view={view}
          />
        )
      }
      case ViewType.enum.Connect: {
        return (
          <RenderConnectControls
            cursor={cursor}
            setWorld={setWorld}
            view={view}
          />
        )
      }
      case ViewType.enum.Select: {
        return <RenderSelectControls view={view} />
      }
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
        case EntityType.enum.Generator:
        case EntityType.enum.Crafter:
          return (
            <RenderTertiaryButton
              onTap={() => {
                navigate(
                  `connect?sourceId=${cursorEntity.id}`,
                )
              }}
              label="Connect"
            />
          )
        default:
          invariant(false)
      }
    }

    return <RenderDefaultControls cursor={cursor} />
  },
)

interface ButtonProps {
  disabled?: boolean
  onTap?(): void
  onHold?(): void
  label: string
}

function RenderPrimaryButton({
  disabled = false,
  onTap,
  onHold,
  label,
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

  if (disabled) {
    return (
      <button
        className={styles['primary-button']}
        data-pointer="capture"
        disabled={disabled}
      >
        {label}
      </button>
    )
  }

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
      {label}
    </button>
  )
}

function RenderSecondaryButton({
  disabled = false,
  onTap,
  label,
}: ButtonProps) {
  return (
    <button
      className={styles['secondary-button']}
      data-pointer="capture"
      onPointerUp={disabled ? undefined : onTap}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

// eslint-disable-next-line
function RenderTertiaryButton({
  disabled = false,
  onTap,
  label,
}: ButtonProps) {
  return (
    <button
      className={styles['tertiary-button']}
      data-pointer="capture"
      onPointerUp={disabled ? undefined : onTap}
      disabled={disabled}
    >
      {label}
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
    invariant(cursor.entityId)
    minePatch(setWorld, cursor.entityId)
  }, [cursor.entityId])

  return (
    <>
      <RenderPrimaryButton onHold={mine} label="Mine" />
      <RenderSecondaryButton
        disabled={
          !inventoryHas(cursor.inventory, minerRecipe.input)
        }
        onTap={() => {
          const search = new URLSearchParams()
          search.set('entityType', EntityType.enum.Miner)
          const connections: Connections = {
            [entity.id]: ConnectionType.enum.Item,
          }
          search.set(
            'connections',
            JSON.stringify(connections),
          )
          navigate(`build?${search.toString()}`)
        }}
        label="Build Miner"
      />
      <RenderTertiaryButton
        onTap={() => {
          navigate(`connect?sourceId=${entity.id}`)
        }}
        label="Connect"
      />
    </>
  )
}

interface RenderDefaultControlsProps {
  cursor: Cursor
}

function RenderDefaultControls({
  cursor,
}: RenderDefaultControlsProps) {
  const navigate = useNavigate()

  const availableRecipes = getAvailableEntityRecipes(
    cursor.inventory,
  )
  const recipe = availableRecipes.at(0)

  const primary: ButtonProps = {
    disabled: !recipe,
    onTap: () => {
      invariant(recipe)
      const search = new URLSearchParams()
      search.set('entityType', recipe.output)
      navigate(`build?${search.toString()}`)
    },
    label: 'Build',
  }

  const secondary: ButtonProps = {
    onTap() {
      navigate('select')
    },
    label: 'Select',
  }

  return <Render primary={primary} secondary={secondary} />
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
  const navigate = useNavigate()

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
    moveFromCursorToEntityInput(setWorld, entity.id, {
      [ItemType.enum.Coal]: 1,
    })
  }, [hasCoal])

  const addIronOre = useCallback(() => {
    if (!hasIronOre) return
    moveFromCursorToEntityInput(setWorld, entity.id, {
      [ItemType.enum.IronOre]: 1,
    })
  }, [hasIronOre])

  const primary: ButtonProps =
    coalCount < 5 && hasCoal
      ? {
          onHold: addCoal,
          label: 'Add Coal',
        }
      : {
          disabled: !hasIronOre,
          onHold: addIronOre,
          label: 'Add Iron Ore',
        }

  const secondary: ButtonProps = {
    disabled: !hasOutput,
    onTap: () => {
      if (!hasOutput) return
      invariant(cursor.entityId)
      moveFromEntityOutputToCursor(
        setWorld,
        cursor.entityId,
      )
    },
    label: 'Take All',
  }

  const tertiary: ButtonProps = {
    onTap: () => {
      navigate(`connect?sourceId=${entity.id}`)
    },
    label: 'Connect',
  }

  return (
    <Render
      primary={primary}
      secondary={secondary}
      tertiary={tertiary}
    />
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
    return first.length ? ItemType.parse(first.at(0)) : null
  })()

  const hasOutput = outputType !== null
  const hasCoal =
    (cursor.inventory[ItemType.enum.Coal] ?? 0) > 0

  const addCoal = useCallback(() => {
    if (!hasCoal) return
    moveFromCursorToEntityInput(setWorld, entity.id, {
      [ItemType.enum.Coal]: 1,
    })
  }, [hasCoal])

  const navigate = useNavigate()

  return (
    <Render
      primary={{
        disabled: !hasCoal,
        onHold: addCoal,
        label: 'Add Coal',
      }}
      secondary={{
        disabled: !hasOutput,
        onTap: () => {
          if (!hasOutput) return
          moveFromEntityOutputToCursor(setWorld, entity.id)
        },
        label: 'Take All',
      }}
      tertiary={{
        onTap: () => {
          navigate(`connect?sourceId=${entity.id}`)
        },
        label: 'Connect',
      }}
    />
  )
}

interface RenderProps {
  primary?: ButtonProps
  secondary?: ButtonProps
  tertiary?: ButtonProps
}

function Render({
  primary,
  secondary,
  tertiary,
}: RenderProps) {
  return (
    <>
      <RenderPrimaryButton
        disabled={primary?.disabled}
        onTap={primary?.onTap}
        onHold={primary?.onHold}
        label={primary?.label ?? ''}
      />
      <RenderSecondaryButton
        disabled={secondary?.disabled}
        onTap={secondary?.onTap}
        onHold={secondary?.onHold}
        label={secondary?.label ?? ''}
      />
      <RenderTertiaryButton
        disabled={tertiary?.disabled}
        onTap={tertiary?.onTap}
        onHold={tertiary?.onHold}
        label={tertiary?.label ?? ''}
      />
    </>
  )
}
