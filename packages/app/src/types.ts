import * as z from 'zod'
import { Vec2 } from './vec2.js'

export const EntityId = z.string()
export type EntityId = z.infer<typeof EntityId>

export const ItemType = z.enum([
  'MineableCoal',
  'MineableIronOre',
  'MineableStone',

  'Coal',
  'IronOre',
  'Stone',

  'IronPlate',

  'IronGear',

  'Power',
])
export type ItemType = z.infer<typeof ItemType>

export const Inventory = z.record(ItemType, z.number())
export type Inventory = z.infer<typeof Inventory>

export const EntityType = z.enum([
  'Patch',
  'Science',

  'Smelter',
  'Miner',
  'Generator',
  'Crafter',
])
export type EntityType = z.infer<typeof EntityType>

const EntityShapeBase = z.strictObject({
  id: EntityId,
  position: Vec2,
  radius: z.number().positive(),

  itemType: ItemType,

  input: z.record(
    ItemType,
    z.record(EntityId, z.literal(true)),
  ),
  output: z.record(
    ItemType,
    z.record(EntityId, z.literal(true)),
  ),
})

const EntityStateBase = z.strictObject({
  id: EntityId,
  input: Inventory,
  output: Inventory,
  satisfaction: z.number(),
})

//
// Smelter
//
export const SmelterEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Smelter),
})
export type SmelterEntityShape = z.infer<
  typeof SmelterEntityShape
>
// prettier-ignore
export const SmelterEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Smelter),
})
export type SmelterEntityState = z.infer<
  typeof SmelterEntityState
>
export const SmelterEntity = z.strictObject({
  type: z.literal(EntityType.enum.Smelter),
  id: EntityId,
  shape: SmelterEntityShape,
  state: SmelterEntityState,
})
export type SmelterEntity = z.infer<typeof SmelterEntity>

//
// Patch
//
export const PatchEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Patch),
})
export type PatchEntityShape = z.infer<
  typeof PatchEntityShape
>
export const PatchEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Patch),
})
export type PatchEntityState = z.infer<
  typeof PatchEntityState
>
export const PatchEntity = z.strictObject({
  type: z.literal(EntityType.enum.Patch),
  id: EntityId,
  shape: PatchEntityShape,
  state: PatchEntityState,
})
export type PatchEntity = z.infer<typeof PatchEntity>

//
// Miner
//
export const MinerEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Miner),
})
export type MinerEntityShape = z.infer<
  typeof MinerEntityShape
>
// prettier-ignore
export const MinerEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Miner),
})
export type MinerEntityState = z.infer<
  typeof MinerEntityState
>
export const MinerEntity = z.strictObject({
  type: z.literal(EntityType.enum.Miner),
  id: EntityId,
  shape: MinerEntityShape,
  state: MinerEntityState,
})
export type MinerEntity = z.infer<typeof MinerEntity>

//
// Generator
//
export const GeneratorEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Generator),
})
export type GeneratorEntityShape = z.infer<
  typeof GeneratorEntityShape
>
// prettier-ignore
export const GeneratorEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Generator),
})
export type GeneratorEntityState = z.infer<
  typeof GeneratorEntityState
>
export const GeneratorEntity = z.strictObject({
  type: z.literal(EntityType.enum.Generator),
  id: EntityId,
  shape: GeneratorEntityShape,
  state: GeneratorEntityState,
})
export type GeneratorEntity = z.infer<
  typeof GeneratorEntity
>

//
// Crafter
//
export const CrafterEntityShape = EntityShapeBase.extend({
  type: z.literal(EntityType.enum.Crafter),
})
export type CrafterEntityShape = z.infer<
  typeof CrafterEntityShape
>
// prettier-ignore
export const CrafterEntityState = EntityStateBase.extend({
  type: z.literal(EntityType.enum.Crafter),
})
export type CrafterEntityState = z.infer<
  typeof CrafterEntityState
>
export const CrafterEntity = z.strictObject({
  type: z.literal(EntityType.enum.Crafter),
  id: EntityId,
  shape: CrafterEntityShape,
  state: CrafterEntityState,
})
export type CrafterEntity = z.infer<typeof CrafterEntity>

export const EntityShape = z.discriminatedUnion('type', [
  SmelterEntityShape,
  PatchEntityShape,
  MinerEntityShape,
  GeneratorEntityShape,
  CrafterEntityShape,
])
export type EntityShape = z.infer<typeof EntityShape>

export const EntityState = z.discriminatedUnion('type', [
  SmelterEntityState,
  PatchEntityState,
  MinerEntityState,
  GeneratorEntityState,
  CrafterEntityState,
])
export type EntityState = z.infer<typeof EntityState>

export const Entity = z.discriminatedUnion('type', [
  SmelterEntity,
  PatchEntity,
  MinerEntity,
  GeneratorEntity,
  CrafterEntity,
])
export type Entity = z.infer<typeof Entity>

export const Cursor = z.strictObject({
  entityId: EntityId.nullable(),
  inventory: Inventory,
  radius: z.literal(1),
})
export type Cursor = z.infer<typeof Cursor>

export const TaskId = z.string()
export type TaskId = z.infer<typeof TaskId>

export const TaskType = z.enum(['Mine'])
export type TaskType = z.infer<typeof TaskType>

export const MineTask = z.strictObject({
  id: TaskId,
  type: z.literal(TaskType.enum.Mine),
  itemType: z.union([
    z.literal(ItemType.enum.Coal),
    z.literal(ItemType.enum.IronOre),
    z.literal(ItemType.enum.Stone),
  ]),
  count: z.number(),
  progress: z.number(),
})
export type MineTask = z.infer<typeof MineTask>

export const Task = z.discriminatedUnion('type', [MineTask])
export type Task = z.infer<typeof Task>

export const World = z.strictObject({
  tick: z.number().int().nonnegative(),

  task: Task,

  cursor: Cursor,

  shapes: z.record(EntityId, EntityShape),
  states: z.record(EntityId, EntityState),

  nextEntityId: z.number().int().nonnegative(),
})
export type World = z.infer<typeof World>
