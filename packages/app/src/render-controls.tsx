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
import { ConnectAction, ViewType } from './view.js'
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
}

export const RenderControls = React.memo(
  function RenderControls({
    cursor,
    cursorEntity,
    setWorld,
  }: RenderControlsProps) {
    const navigate = useNavigate()
    const { camera$ } = useContext(AppContext)
    const { view } = useContext(ViewContext)
    const setSearch = useSearchParams()[1]

    switch (view.type) {
      case ViewType.enum.Build: {
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
            >
              Build {view.entityType}
            </RenderPrimaryButton>
            <RenderSecondaryButton
              onTap={() => {
                navigate('..')
              }}
            >
              Back
            </RenderSecondaryButton>
            <RenderTertiaryButton
              disabled={availableRecipes.length < 2}
              onTap={() => {
                let i = availableRecipes.findIndex(
                  (recipe) =>
                    recipe.output === view.entityType,
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
            >
              Recipe
            </RenderTertiaryButton>
          </>
        )
      }
      case ViewType.enum.Connect: {
        return (
          <>
            <RenderPrimaryButton
              disabled={view.action === null}
              onTap={() => {
                invariant(cursor.entityId)
                if (
                  view.action === ConnectAction.enum.Connect
                ) {
                  addConnection(
                    setWorld,
                    view.sourceId,
                    cursor.entityId,
                  )
                } else if (
                  view.action ===
                  ConnectAction.enum.Disconnect
                ) {
                  removeConnection(
                    setWorld,
                    view.sourceId,
                    cursor.entityId,
                  )
                }
              }}
            >
              {view.action === ConnectAction.enum.Disconnect
                ? 'Disconnect'
                : 'Connect'}
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
            >
              Connect
            </RenderTertiaryButton>
          )
        default:
          invariant(false)
      }
    }

    return <RenderDefaultControls cursor={cursor} />
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

  if (disabled) {
    return (
      <button
        className={styles['primary-button']}
        data-pointer="capture"
        disabled={disabled}
      >
        {children}
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
      onPointerUp={disabled ? undefined : onTap}
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
      onPointerUp={disabled ? undefined : onTap}
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
    invariant(cursor.entityId)
    minePatch(setWorld, cursor.entityId)
  }, [cursor.entityId])

  return (
    <>
      <RenderPrimaryButton onHold={mine}>
        Mine
      </RenderPrimaryButton>
      <RenderSecondaryButton
        disabled={
          !inventoryHas(cursor.inventory, minerRecipe.input)
        }
        onTap={() => {
          const search = new URLSearchParams()
          search.set('entityType', EntityType.enum.Miner)
          search.set(
            'connections',
            JSON.stringify({
              [entity.id]: true,
            }),
          )
          navigate(`build?${search.toString()}`)
        }}
      >
        Build Miner
      </RenderSecondaryButton>
      <RenderTertiaryButton
        onTap={() => {
          navigate(`connect?sourceId=${entity.id}`)
        }}
      >
        Connect
      </RenderTertiaryButton>
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

  return (
    <>
      <RenderPrimaryButton
        disabled={!recipe}
        onTap={() => {
          if (recipe) {
            const search = new URLSearchParams()
            search.set('entityType', recipe.output)
            navigate(`build?${search.toString()}`)
          }
        }}
      >
        Build
      </RenderPrimaryButton>
      <RenderSecondaryButton
        onTap={() => {
          navigate('select')
        }}
      >
        Select
      </RenderSecondaryButton>
    </>
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

  return (
    <>
      <RenderSecondaryButton
        disabled={!hasOutput}
        onTap={() => {
          if (!hasOutput) return
          invariant(cursor.entityId)
          moveFromEntityOutputToCursor(
            setWorld,
            cursor.entityId,
          )
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
      <RenderTertiaryButton
        onTap={() => {
          navigate(`connect?sourceId=${entity.id}`)
        }}
      >
        Connect
      </RenderTertiaryButton>
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
    <>
      <RenderPrimaryButton
        disabled={!hasCoal}
        onHold={addCoal}
      >
        Add Coal
      </RenderPrimaryButton>
      <RenderSecondaryButton
        disabled={!hasOutput}
        onTap={() => {
          if (!hasOutput) return
          moveFromEntityOutputToCursor(setWorld, entity.id)
        }}
      >
        Take All
      </RenderSecondaryButton>
      <RenderTertiaryButton
        onTap={() => {
          navigate(`connect?sourceId=${entity.id}`)
        }}
      >
        Connect
      </RenderTertiaryButton>
    </>
  )
}
