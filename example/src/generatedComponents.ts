/**
 * Entitas Generated Classes for example
 *
 * do not edit this file
 */
module example {

  import Pool = entitas.Pool;
  import Entity = entitas.Entity;
  import Matcher = entitas.Matcher;
  import ISystem = entitas.ISystem;
  import IMatcher = entitas.IMatcher;
  import IComponent = entitas.IComponent;

  export enum CoreComponentIds {
    Bounds,
    Bullet,
    ColorAnimation,
    Enemy,
    Expires,
    Firing,
    Health,
    ParallaxStar,
    Player,
    Position,
    ScaleAnimation,
    SoundEffect,
    Sprite,
    Velocity,
    Score,
    Destroy,
    Mouse,
    Scale,
    Resource,
    Layer,
    TotalComponents
  }

  entitas.initialize(CoreComponentIds.TotalComponents, {"entities":200,"components":128});


  export class BoundsComponent implements IComponent {
    public radius:number;
  }
  export class BulletComponent implements IComponent {
  }
  export class ColorAnimationComponent implements IComponent {
    public redMin:number;
    public redMax:number;
    public redSpeed:number;
    public greenMin:number;
    public greenMax:number;
    public greenSpeed:number;
    public blueMin:number;
    public blueMax:number;
    public blueSpeed:number;
    public alphaMin:number;
    public alphaMax:number;
    public alphaSpeed:number;
    public redAnimate:boolean;
    public greenAnimate:boolean;
    public blueAnimate:boolean;
    public alphaAnimate:boolean;
    public repeat:boolean;
  }
  export class EnemyComponent implements IComponent {
  }
  export class ExpiresComponent implements IComponent {
    public delay:number;
  }
  export class FiringComponent implements IComponent {
  }
  export class HealthComponent implements IComponent {
    public health:number;
    public maximumHealth:number;
  }
  export class ParallaxStarComponent implements IComponent {
  }
  export class PlayerComponent implements IComponent {
  }
  export class PositionComponent implements IComponent {
    public x:number;
    public y:number;
  }
  export class ScaleAnimationComponent implements IComponent {
    public min:number;
    public max:number;
    public speed:number;
    public repeat:boolean;
    public active:boolean;
  }
  export class SoundEffectComponent implements IComponent {
    public effect:number;
  }
  export class SpriteComponent implements IComponent {
    public layer:number;
    public object:Object;
  }
  export class VelocityComponent implements IComponent {
    public x:number;
    public y:number;
  }
  export class ScoreComponent implements IComponent {
    public value:number;
  }
  export class DestroyComponent implements IComponent {
  }
  export class MouseComponent implements IComponent {
    public x:number;
    public y:number;
  }
  export class ScaleComponent implements IComponent {
    public x:number;
    public y:number;
  }
  export class ResourceComponent implements IComponent {
    public name:string;
  }
  export class LayerComponent implements IComponent {
    public ordinal:number;
  }


  export class Pools {
    
    static _allPools:Array<Pool>;
    
    static get allPools():Array<Pool> {
      if (Pools._allPools == null) {
        Pools._allPools = [Pools.pool];
      }
      return Pools._allPools;
    }
    
    static _pool:Pool;
    
    static get pool():Pool {
      if (Pools._pool == null) {
        Pools._pool = new Pool(CoreComponentIds, CoreComponentIds.TotalComponents);
        entitas.browser.VisualDebugging.init(Pools._pool);
      }
    
      return Pools._pool;
    }
  }
}