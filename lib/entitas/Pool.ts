module entitas {

  import UUID = entitas.utils.UUID;
  import Bag = entitas.utils.Bag;
  import ImmutableBag = entitas.utils.ImmutableBag;

  import Group = entitas.Group;
  import Entity = entitas.Entity;
  import Signal = entitas.utils.Signal;
  import ISignal = entitas.utils.ISignal;
  import IMatcher = entitas.IMatcher;
  import ISetPool = entitas.ISetPool;
  import PoolChanged = Pool.PoolChanged;
  import IComponent = entitas.IComponent;
  import GroupChanged = Pool.GroupChanged;
  import IReactiveSystem = entitas.IReactiveSystem;
  import IMultiReactiveSystem = entitas.IMultiReactiveSystem;
  import EntityIsNotDestroyedException = entitas.exceptions.EntityIsNotDestroyedException;
  import PoolDoesNotContainEntityException = entitas.exceptions.PoolDoesNotContainEntityException;

  /**
   * event delegate boilerplate:
   */
  export module Pool {

    /**
     * Event PoolChanged
     *
     * Pool has changed
     */
    export interface PoolChanged { (pool: Pool, entity: Entity): void; }
    export interface IPoolChanged<T> extends ISignal<T> {
      dispatch(pool: Pool, entity: Entity): void;
    }

    /**
     * Event GroupChanged
     *
     * Group has changed
     */
    export interface GroupChanged { (pool: Pool, group: Group): void; }
    export interface IGroupChanged<T> extends ISignal<T> {
      dispatch(pool: Pool, group: Group): void;
    }
  }

  /**
   * A cached pool of entities and components.
   * The games world.
   */
  export class Pool {

    /**
     * The total number of components in this pool
     * @type {number}
     * @name entitas.Pool#totalComponents */
    public get totalComponents(): number { return this._totalComponents; }

    /**
     * Count of active entities
     * @type {number}
     * @name entitas.Pool#count */
    public get count(): number { return Object.keys(this._entities).length; }

    /**
     * Count of entities waiting to be recycled
     * @type {number}
     * @name entitas.Pool#reusableEntitiesCount */
    public get reusableEntitiesCount(): number { return this._reusableEntities.size(); }

    /**
     * Count of entities that sill have references
     * @type {number}
     * @name entitas.Pool#retainedEntitiesCount */
    public get retainedEntitiesCount(): number { return Object.keys(this._retainedEntities).length; }

    /**
     * Subscribe to Entity Created Event
     * @type {entitas.utils.ISignal} */
    public onEntityCreated: Pool.IPoolChanged<PoolChanged> = null;

    /**
     * Subscribe to Entity Will Be Destroyed Event
     * @type {entitas.utils.ISignal} */
    public onEntityWillBeDestroyed: Pool.IPoolChanged<PoolChanged> = null;

    /**
     * Subscribe to Entity Destroyed Event
     * @type {entitas.utils.ISignal} */
    public onEntityDestroyed: Pool.IPoolChanged<PoolChanged> = null;

    /**
     * Subscribe to Group Created Event
     * @type {entitas.utils.ISignal} */
    public onGroupCreated: Pool.IGroupChanged<GroupChanged> = null;

    /**
     * Entity name for debugging
     * @type {string} */
    public name: string = '';

    /**
     * Collection of all entities by Id
     * @type {Object<string,entitas.Entity>} */
    public _entities = {};

    /**
     * Collection of all groups by matcher Id
     * @type {Object<string,entitas.Group>} */
    public _groups = {};

    /**
     * Bag of groups by index
     * @type {entitas.util.Bag<Group>} */
    public _groupsForIndex: Bag<Bag<Group>> = null;

    /**
     * Bag of entities waiting to be recycled
     * @type {entitas.util.Bag<Entity>} */
    public _reusableEntities: Bag<Entity> = new Bag<Entity>();

    /**
     * Collection of entities waiting to be released
     * @type {Object<string,entitas.Entity>} */
    public _retainedEntities = {};

    /**
     * An enum of valid component types
     * @type {Object<string,number>} */
    public static componentsEnum: Object = null;

    /**
     * Count of components
     * @type {number} */
    public static totalComponents: number = 0;

    /**
     * Global reference to pool instance
     * @type {entitas.Pool} */
    public static instance: Pool = null;

    /**
     * An enum of valid component types
     * @type {Object<string,number>} */
    public _componentsEnum: Object = null;

    /**
     * Count of components
     * @type {number} */
    public _totalComponents: number = 0;

    /**
     * Next entity index
     * @type {number} */
    public _creationIndex: number = 0;

    /**
     * A list of all the entities
     * @type {Array<entitas.Entity?} */
    public _entitiesCache: Array<Entity> = null;

    /** @type {Function} */
    public _cachedUpdateGroupsComponentAddedOrRemoved: Entity.EntityChanged;
    /** @type {Function} */
    public _cachedUpdateGroupsComponentReplaced: Entity.ComponentReplaced;
    /** @type {Function} */
    public _cachedOnEntityReleased: Entity.EntityReleased;

    /**
     * Get entities for Matcher
     * @override
     * @param {entitas.IMatcher} matcher
     * @returns {Array<entitas.Entity>}
     */
    public getEntities(matcher: IMatcher): Entity[];

    /**
     * Get all entities
     * @override
     * @returns {Array<entitas.Entity>}
     */
    public getEntities(): Entity[];

    /**
     * Get all entities
     * @override
     * @param {entitas.ISystem} system
     */
    public createSystem(system: ISystem);

    /**
     * Get all entities
     * @override
     * @param {Function} system
     */
    public createSystem(system: Function);

    /**
     * Set Spool
     * @param {entitas.ISystem} system
     * @param {entitas.Pool} pool
     */
    public static setPool(system: ISystem, pool: Pool);

    /**
     * @constructor
     * @param {Object} components
     * @param {number} totalComponents
     * @param {number} startCreationIndex
     */
    constructor(components: {}, totalComponents: number, startCreationIndex: number = 0) {
      Pool.instance = this;
      this.onGroupCreated = new Signal<GroupChanged>(this);
      this.onEntityCreated = new Signal<PoolChanged>(this);
      this.onEntityDestroyed = new Signal<PoolChanged>(this);
      this.onEntityWillBeDestroyed = new Signal<PoolChanged>(this);

      this._componentsEnum = components;
      this._totalComponents = totalComponents;
      this._creationIndex = startCreationIndex;
      this._groupsForIndex = new Bag<Bag<Group>>();
      this._cachedUpdateGroupsComponentAddedOrRemoved = this.updateGroupsComponentAddedOrRemoved;
      this._cachedUpdateGroupsComponentReplaced = this.updateGroupsComponentReplaced;
      this._cachedOnEntityReleased = this.onEntityReleased;
      Pool.componentsEnum = components;
      Pool.totalComponents = totalComponents;

    }

    /**
     * Create a new entity
     * @param {string} name
     * @returns {entitas.Entity}
     */
    public createEntity(name: string): Entity {
      var entity = this._reusableEntities.size() > 0 ? this._reusableEntities.removeLast() : new Entity(this._componentsEnum, this._totalComponents);
      entity._isEnabled = true;
      entity.name = name;
      entity._creationIndex = this._creationIndex++;
      entity.id = UUID.randomUUID()
      entity.addRef();
      this._entities[entity.id] = entity;
      this._entitiesCache = null;
      entity.onComponentAdded.add(this._cachedUpdateGroupsComponentAddedOrRemoved);
      entity.onComponentRemoved.add(this._cachedUpdateGroupsComponentAddedOrRemoved);
      entity.onComponentReplaced.add(this._cachedUpdateGroupsComponentReplaced);
      entity.onEntityReleased.add(this._cachedOnEntityReleased);

      var onEntityCreated: any = this.onEntityCreated;
      if (onEntityCreated.active) onEntityCreated.dispatch(this, entity);
      return entity;
    }

    /**
     * Destroy an entity
     * @param {entitas.Entity} entity
     */
    public destroyEntity(entity: Entity) {
      if (!(entity.id in this._entities)) {
        throw new PoolDoesNotContainEntityException(entity,
          "Could not destroy entity!");
      }
      delete this._entities[entity.id];
      this._entitiesCache = null;
      var onEntityWillBeDestroyed: any = this.onEntityWillBeDestroyed;
      if (onEntityWillBeDestroyed.active) onEntityWillBeDestroyed.dispatch(this, entity);
      entity.destroy();

      var onEntityDestroyed: any = this.onEntityDestroyed;
      if (onEntityDestroyed.active) onEntityDestroyed.dispatch(this, entity);

      if (entity._refCount === 1) {
        entity.onEntityReleased.remove(this._cachedOnEntityReleased);
        this._reusableEntities.add(entity);
      } else {
        this._retainedEntities[entity.id] = entity;
      }
      entity.release();

    }

    /**
     * Destroy All Entities
     */
    public destroyAllEntities() {
      var entities = this.getEntities();
      for (var i = 0, entitiesLength = entities.length; i < entitiesLength; i++) {
        this.destroyEntity(entities[i]);
      }
    }

    /**
     * Check if pool has this entity
     *
     * @param {entitas.Entity} entity
     * @returns {boolean}
     */
    public hasEntity(entity: Entity): boolean {
      return entity.id in this._entities
    }

    /**
     * Gets all of the entities
     *
     * @returns {Array<entitas.Entity>}
     */
    public getEntities(): Entity[] {
      if (this._entitiesCache == null) {

        var entities = this._entities;
        var keys = Object.keys(entities);
        var length = keys.length;
        var entitiesCache = this._entitiesCache = new Array(length);

        for (var i = 0; i < length; i++) {
          var k = keys[i];
          entitiesCache[i] = entities[k];
        }
      }
      return entitiesCache;
    }

    /**
     * Gets all of the entities that match
     *
     * @param {entias.IMatcher} matcher
     * @returns {entitas.Group}
     */
    public getGroup(matcher: IMatcher):Group {
      var group: Group;

      if (matcher.id in this._groups) {
        group = this._groups[matcher.id];
      } else {
        group = new Group(matcher);

        var entities = this.getEntities();
        for (var i = 0, entitiesLength = entities.length; i < entitiesLength; i++) {
          group.handleEntitySilently(entities[i]);
        }
        this._groups[matcher.id] = group;

        for (var i = 0, indicesLength = matcher.indices.length; i < indicesLength; i++) {
          var index = matcher.indices[i];
          if (this._groupsForIndex[index] == null) {
            this._groupsForIndex[index] = new Bag();
          }
          this._groupsForIndex[index].add(group);
        }
        var onGroupCreated: any = this.onGroupCreated;
        if (onGroupCreated.active) onGroupCreated.dispatch(this, group);
      }
      return group;
    }

    /**
     * @param {entitas.Entity} entity
     * @param {number} index
     * @param {entitas.IComponent} component
     */
    protected updateGroupsComponentAddedOrRemoved = (entity: Entity, index: number, component: IComponent) => {
      var groups = this._groupsForIndex[index];
      if (groups != null) {
        for (var i = 0, groupsCount = groups.size(); i < groupsCount; i++) {
          groups[i].handleEntity(entity, index, component);
        }
      }
    };


    /**
     * @param {entitas.Entity} entity
     * @param {number} index
     * @param {entitas.IComponent} previousComponent
     * @param {entitas.IComponent} newComponent
     */
    protected updateGroupsComponentReplaced = (entity: Entity, index: number, previousComponent: IComponent, newComponent: IComponent) => {
      var groups = this._groupsForIndex[index];
      if (groups != null) {
        for (var i = 0, groupsCount = groups.size(); i < groupsCount; i++) {
          groups[i].updateEntity(entity, index, previousComponent, newComponent);
        }
      }
    };

    /**
     * @param {entitas.Entity} entity
     */
    protected onEntityReleased = (entity: Entity) => {
      if (entity._isEnabled) {
        throw new EntityIsNotDestroyedException("Cannot release entity.");
      }
      entity.onEntityReleased.remove(this._cachedOnEntityReleased);
      delete this._retainedEntities[entity.id];
      this._reusableEntities.add(entity);
    };
  }
}