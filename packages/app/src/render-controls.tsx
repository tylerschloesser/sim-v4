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
import { BehaviorSubject } from 'rxjs'
import invariant from 'tiny-invariant'
import { Updater } from 'use-immer'
import {
  buildEntity,
  minePatch,
  moveEntity,
  moveFromCursorToEntityInput,
  moveFromEntityOutputToCursor,
} from './action.js'
import { Camera } from './camera.js'
import { inventoryHas } from './inventory.js'
import {
  ItemRecipeKey,
  entityRecipes,
  getAvailableItemRecipes,
  itemRecipes,
} from './recipe.js'
import styles from './render-controls.module.scss'
import { vec2 } from './vec2.js'
import { ViewContext } from './view-context.js'
import {
  BuildView,
  EditView,
  SelectView,
  ViewType,
  useSetViewSearchParam,
} from './view.js'
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
  camera$: BehaviorSubject<Camera>
  cursor: Cursor
  cursorEntity: Entity | null
  setWorld: Updater<World>
}

interface RenderEditControlsProps {
  camera$: BehaviorSubject<Camera>
  cursor: Cursor
  setWorld: Updater<World>
  view: EditView
}

function RenderEditControls({
  camera$,
  setWorld,
  view,
}: RenderEditControlsProps) {
  const setView = useSetViewSearchParam()

  const primary: ButtonProps = {
    disabled: !view.valid,
    onTap() {
      moveEntity(
        setWorld,
        view.entityId,
        vec2.clone(camera$.value.position),
        view.input,
        view.output,
      )
    },
    label: 'Move',
  }

  const secondary: ButtonProps = {
    onTap() {
      setView(null)
    },
    label: 'Back',
  }

  return <Render primary={primary} secondary={secondary} />
}

interface RenderBuildControlsProps {
  camera$: BehaviorSubject<Camera>
  cursor: Cursor
  setWorld: Updater<World>
  view: BuildView
}

function RenderBuildControls({
  camera$,
  cursor,
  setWorld,
  view,
}: RenderBuildControlsProps) {
  const setView = useSetViewSearchParam()
  const availableRecipes = getAvailableItemRecipes(
    cursor.inventory,
  )

  const recipe = itemRecipes[view.itemRecipeKey]

  const primary: ButtonProps = {
    disabled: !view.valid,
    onTap() {
      buildEntity(
        setWorld,
        recipe.entityType,
        view.itemRecipeKey,
        vec2.clone(camera$.value.position),
        view.input,
        view.output,
      )
    },
    label: `${recipe.itemRecipeKey} ${recipe.entityType}`,
  }

  const secondary: ButtonProps = {
    onTap() {
      setView(null)
    },
    label: 'Back',
  }

  const tertiary: ButtonProps = {
    disabled: availableRecipes.length < 2,
    onTap() {
      let i = availableRecipes.findIndex(
        (recipe) =>
          recipe.itemRecipeKey === view.itemRecipeKey,
      )
      invariant(i >= 0)

      i = (i + 1) % availableRecipes.length
      invariant(i < availableRecipes.length)

      const next = availableRecipes[i]
      invariant(next)

      setView({
        type: ViewType.enum.Build,
        itemRecipeKey: next.itemRecipeKey,
      })
    },
    label: 'Recipe',
  }

  return (
    <Render
      primary={primary}
      secondary={secondary}
      tertiary={tertiary}
    />
  )
}

interface RenderSelectControlsProps {
  view: SelectView
}

function RenderSelectControls({
  // eslint-disable-next-line
  view: _view,
}: RenderSelectControlsProps) {
  const setView = useSetViewSearchParam()
  const primary: ButtonProps = {
    label: 'Select',
  }
  const secondary: ButtonProps = {
    onTap() {
      setView(null)
    },
    label: 'Cancel',
  }
  return <Render primary={primary} secondary={secondary} />
}

export const RenderControls = React.memo(
  function RenderControls({
    camera$,
    cursor,
    cursorEntity,
    setWorld,
  }: RenderControlsProps) {
    const { view } = useContext(ViewContext)

    switch (view.type) {
      case ViewType.enum.Build: {
        return (
          <RenderBuildControls
            camera$={camera$}
            cursor={cursor}
            setWorld={setWorld}
            view={view}
          />
        )
      }
      case ViewType.enum.Select: {
        return <RenderSelectControls view={view} />
      }
      case ViewType.enum.Edit: {
        return (
          <RenderEditControls
            camera$={camera$}
            cursor={cursor}
            setWorld={setWorld}
            view={view}
          />
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
            <RenderEntityControls entity={cursorEntity} />
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
  const setView = useSetViewSearchParam()
  const minerRecipe = entityRecipes[EntityType.enum.Miner]
  invariant(minerRecipe)

  const mine = useCallback(() => {
    invariant(cursor.entityId)
    minePatch(setWorld, cursor.entityId)
  }, [cursor.entityId])

  const itemRecipeKey: ItemRecipeKey = (() => {
    const keys = Object.keys(entity.state.output)
    invariant(keys.length === 1)
    const itemType = ItemType.parse(keys.at(0))
    switch (itemType) {
      case ItemType.enum.MineableCoal:
        return ItemRecipeKey.enum.Coal
      case ItemType.enum.MineableIronOre:
        return ItemRecipeKey.enum.IronOre
      case ItemType.enum.MineableStone:
        return ItemRecipeKey.enum.Stone
      default:
        invariant(false)
    }
  })()

  const primary: ButtonProps = {
    onHold: mine,
    label: 'Mine',
  }

  const secondary: ButtonProps = {
    disabled: !inventoryHas(
      cursor.inventory,
      minerRecipe.input,
    ),
    onTap() {
      setView({
        type: ViewType.enum.Build,
        itemRecipeKey,
      })
    },
    label: 'Build Miner',
  }

  return (
    <RenderEntityControls
      entity={entity}
      primary={primary}
      secondary={secondary}
    />
  )
}

interface RenderDefaultControlsProps {
  cursor: Cursor
}

function RenderDefaultControls({
  cursor,
}: RenderDefaultControlsProps) {
  const setView = useSetViewSearchParam()

  const availableRecipes = getAvailableItemRecipes(
    cursor.inventory,
  )
  const recipe = availableRecipes.at(0)

  const primary: ButtonProps = {
    disabled: !recipe,
    onTap: () => {
      invariant(recipe)
      setView({
        type: ViewType.enum.Build,
        itemRecipeKey: recipe.itemRecipeKey,
      })
    },
    label: 'Build',
  }

  const secondary: ButtonProps = {
    onTap() {
      setView({
        type: ViewType.enum.Select,
        selected: {},
      })
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
    moveFromCursorToEntityInput(setWorld, entity.id, {
      [ItemType.enum.Coal]: 1,
    })
  }, [entity.id])

  const addIronOre = useCallback(() => {
    moveFromCursorToEntityInput(setWorld, entity.id, {
      [ItemType.enum.IronOre]: 1,
    })
  }, [entity.id])

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
      invariant(cursor.entityId)
      moveFromEntityOutputToCursor(
        setWorld,
        cursor.entityId,
      )
    },
    label: 'Take All',
  }

  return (
    <RenderEntityControls
      entity={entity}
      primary={primary}
      secondary={secondary}
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
    moveFromCursorToEntityInput(setWorld, entity.id, {
      [ItemType.enum.Coal]: 1,
    })
  }, [entity.id])

  return (
    <RenderEntityControls
      entity={entity}
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
    />
  )
}

interface RenderEntityControlsProps {
  entity: Entity
  primary?: ButtonProps
  secondary?: ButtonProps
}

function RenderEntityControls({
  entity,
  primary,
  secondary,
}: RenderEntityControlsProps) {
  let tertiary: ButtonProps | undefined = undefined
  const setView = useSetViewSearchParam()
  if (entity.type !== EntityType.enum.Patch) {
    tertiary = {
      label: 'Edit',
      disabled: false,
      onTap() {
        setView({
          type: ViewType.enum.Edit,
          entityId: entity.id,
        })
      },
    }
  }

  return (
    <Render
      primary={primary}
      secondary={secondary}
      tertiary={tertiary}
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
  const navigate = useNavigate()
  const [search] = useSearchParams()
  return (
    <div className={styles.controls}>
      <button
        className={styles['left-button']}
        data-pointer="capture"
        disabled={true}
      ></button>
      <RenderTertiaryButton
        disabled={!tertiary || tertiary?.disabled}
        onTap={tertiary?.onTap}
        onHold={tertiary?.onHold}
        label={tertiary?.label ?? ''}
      />
      <RenderPrimaryButton
        disabled={!primary || primary?.disabled}
        onTap={primary?.onTap}
        onHold={primary?.onHold}
        label={primary?.label ?? ''}
      />
      <RenderSecondaryButton
        disabled={!secondary || secondary?.disabled}
        onTap={secondary?.onTap}
        onHold={secondary?.onHold}
        label={secondary?.label ?? ''}
      />
      <button
        className={styles['right-button']}
        data-pointer="capture"
        disabled={true}
        onPointerUp={() => {
          navigate(`/settings?${search.toString()}`)
        }}
      >
        S
      </button>
    </div>
  )
}
