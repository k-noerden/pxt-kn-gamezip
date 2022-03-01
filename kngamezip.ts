 /**
 * This library is based on the build in game.ts and the zip64.ts libraries.
 * It is distributed under the MIT license
 */


/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf11b" block="KN gamezip"
namespace kngamezip {
    let _display: GAME_ZIP64.ZIP64Display
    let _isGameover: boolean = false;
    let _sprites: LedSprite[];
    let _should_sort: boolean = false;
    let _should_render: boolean = true; // TODO: implement this as a way to render after any change has been made but throught a central "thread"

    let _score: number = 0;
    let _life: number = 3;

    export enum Direction {
        //% block=right
        Right,
        //% block=left
        Left,
        //% block=around
        Around,
    }

    export enum Cardinal {
        // Based on compass directions
        North = 0,
        East = 1,
        South = 2,
        West = 3,
    }

    export enum Edge {
        //% block=any
        Any,
        //% block=top
        Top,
        //% block=right
        Right,
        //% block=bottom
        Bottom,
        //% block=left
        Left,
    }

    export enum SpriteProperty {
        //% block=x
        X,
        //% block=y
        Y,
        //% block=z
        Z,
        //% block=direction
        Direction,
        //% block=brightness
        Brightness,
        //% block=color
        Color,
    }

    function init(): void {
        if (_display) {
            // Already init'ed
            return;
        }
        _display = GAME_ZIP64.createZIP64Display();
        _display.setBrightness(50);
        _sprites = <LedSprite[]>[];

        pins.analogSetPitchPin(AnalogPin.P2); // Enable sound on Zip
        basic.pause(10);
        basic.forever(() => {
            // basic.pause(30);
            basic.pause(3);
            if (_should_render) {
                render();
            }
        })
    }
    function render(): void {
        _should_render = false;
        if (_isGameover || !_display) {
            return;
        }

        if (_should_sort) {
            // Not guaranteed to be stable :(
            // TODO: We should fix that somehow to avoid any flickering.
            _sprites.sort((a, b) => a.compare(b));
            _should_sort = false;
        }
        _display.clear()
        for (let i = 0; i < _sprites.length; i++) {
            _sprites[i]._render();
        }
        _display.show();

    }

    /**
     * Creates a new LED sprite pointing to the right.
     * @param x sprite horizontal coordinate, eg: 2
     * @param y sprite vertical coordinate, eg: 2
     */
    //% weight=60 blockGap=8 help=game/create-sprite
    //% group=Sprite
    //% blockId=kn_game_create_sprite block="create sprite at|x: %x|y: %y"
    //% parts="ledmatrix"
    export function createSprite(x: number, y: number): LedSprite {
        init()
        return new LedSprite(x, y);
    }


    /**
     * Deletes the sprite from the game engine. The sprite will no longer appear on the screen or interact with other sprites.
     * @param sprite sprite to delete
     */
    //% weight=59 blockGap=8 help=game/delete
    //% group=Sprite
    //% blockId="kn_game_delete_sprite" block="delete %this(sprite)"
    export function delete_(sprite: LedSprite|LedSpriteGroup): void {sprite.delete();}

    /**
     * Reports whether the sprite has been deleted from the game engine.
     * @param sprite sprite to delete
     */
    //% weight=58 help=game/is-deleted
    //% group=Sprite
    //% blockId="kn_game_sprite_is_deleted" block="is %sprite|deleted"
    export function isDeleted(sprite: LedSprite|LedSpriteGroup): boolean {return sprite.isDeleted();}

    /**
     * Move a certain number of LEDs in the current direction
     * @param sprite the sprite to move
     * @param distance number of leds to move, eg: 1, -1
     */
    //% weight=50 help=game/move
    //% group=Sprite
    //% blockId=kn_game_move_sprite block="%sprite|move by %distance" blockGap=8
    //% parts="ledmatrix"
    export function move(sprite: LedSprite|LedSpriteGroup, distance: number): void {sprite.move(distance);}

    /**
     * Turn the sprite 90 degrees in the given direction
     * @param sprite the sprite to turn
     * @param direction left or right
     */
    //% weight=49 help=game/turn
    //% group=Sprite
    //% blockId=kn_game_turn_sprite block="%sprite|turn %direction"
    export function turn(sprite: LedSprite|LedSpriteGroup, direction: kngamezip.Direction): void {sprite.turn(direction);}

    /**
     * Sets a property of the sprite
     * @param sprite the sprite
     * @param property the name of the property to change
     * @param the updated value
     */
    //% weight=29 help=game/set
    //% group=Sprite
    //% blockId=kn_game_sprite_set_property block="%sprite|set %property|to %value" blockGap=8
    export function set(sprite: LedSprite|LedSpriteGroup, property: kngamezip.SpriteProperty, value: number): void {sprite.set(property, value);}

    /**
     * Changes a property of the sprite
     * @param sprite the sprite
     * @param property the name of the property to change
     * @param value amount of change, eg: 1
     */
    //% weight=30 help=game/change
    //% group=Sprite
    //% blockId=kn_game_sprite_change_xy block="%sprite|change %property|by %value" blockGap=8
    export function change(sprite: LedSprite|LedSpriteGroup, property: kngamezip.SpriteProperty, value: number): void {sprite.change(property, value);}

    /**
     * Gets a property of the sprite
     * @param sprite the sprite
     * @param property the name of the property to change
     */
    //% weight=28 help=game/get
    //% group=Sprite
    //% blockId=kn_game_sprite_property block="%sprite|%property"
    export function get(sprite: LedSprite|LedSpriteGroup, property: kngamezip.SpriteProperty): number {return sprite.get(property);}

    /**
     * Reports true if sprite has the same position as specified sprite (ignores z-axis)
     * @param sprite the sprite to check overlap or touch
     * @param other the other sprite to check overlap or touch
     */
    //% weight=20 help=game/is-touching
    //% group=Sprite
    //% blockId=kn_game_sprite_touching_sprite block="is %sprite|touching %other" blockGap=8
    // TODO: implement this duality, other could be group too!
    export function isTouching(sprite: LedSprite|LedSpriteGroup, other: LedSprite): boolean {return sprite.isTouching(other);}

    /**
     * Reports true if sprite is touching an edge
     * @param sprite the sprite to check for an edge contact
     * @param edge the edge to look for, eg: Any
     */
    //% weight=19 help=game/is-touching-edge
    //% group=Sprite
    //% blockId=kn_game_sprite_touching_edge block="is %sprite|touching edge %edge" blockGap=8
    export function isTouchingEdge(sprite: LedSprite|LedSpriteGroup, edge: kngamezip.Edge): boolean {return sprite.isTouchingEdge(edge);}

    /**
     * If touching the edge of the stage and facing towards it, then turn away.
     * @param sprite the sprite to check for bounce
     */
    //% weight=18 help=game/if-on-edge-bounce
    //% group=Sprite
    //% blockId=kn_game_sprite_bounce block="%sprite|if on edge, bounce"
    //% parts="ledmatrix"
    export function ifOnEdgeBounce(sprite: LedSprite|LedSpriteGroup): void {sprite.ifOnEdgeBounce();}


    /**
     * Join this sprite into a group.
     * If the sprite is already in a group, it will be removed from that group first.
     * @param group the group to join
     * @param sprite the sprite that should join
     */
    //% weight=59 blockGap=8
    //% group="Sprite group"
    //% blockId=kn_game_join_group block="%sprite|join group %group"
    export function joinGroup(sprite: LedSprite|LedSpriteGroup, group: LedSpriteGroup): void {
        if (sprite.group) {
            sprite.group.removeChild(sprite);
        }
        group.addChild(sprite);
        sprite.group = group;
    }

    /**
     * Leave the current group if in any.
     * @param sprite the sprite that should leave.
     */
    //% weight=58 blockGap=8
    //% group="Sprite group"
    //% blockId=kn_game_leave_group block="%sprite|leave group"
    export function leaveGroup(sprite: LedSprite|LedSpriteGroup): void {
        if (sprite.group) {
            sprite.group.removeChild(sprite)
            sprite.group = null;
        }
    }

    /**
     * Check whether the sprite is member of a group
     * If the sprite is already in a group, it will be removed from that group first.
     * @param group the group it should be in
     * @param sprite the sprite to check
     */
    //% weight=57 blockGap=8
    //% group="Sprite group"
    //% blockId=kn_game_in_group block="%sprite|in group %group"
    export function inGroup(group: LedSpriteGroup, sprite: LedSprite|LedSpriteGroup): boolean {
        return sprite.group == group;
    }




    /**
     * This should really just be an interface,
     * but defining blocks on signatures on an interface is not supported.
     */
    export class BaseSprite {
        protected group: LedSpriteGroup;
        protected constructor() {
            this.group = null;
        }
        // /**
        //  * Deletes the sprite from the game engine. The sprite will no longer appear on the screen or interact with other sprites.
        //  * @param this sprite to delete
        //  */
        // //% weight=59 blockGap=8 help=game/delete
        // //% group=Sprite
        // //% blockId="kn_game_delete_sprite" block="delete %this(sprite)"
        // public delete(): void {control.panic(700);}

        // /**
        //  * Reports whether the sprite has been deleted from the game engine.
        //  */
        // //% weight=58 help=game/is-deleted
        // //% group=Sprite
        // //% blockId="kn_game_sprite_is_deleted" block="is %sprite|deleted"
        // public isDeleted(): boolean {control.panic(700); return false;}

        // /**
        //  * Move a certain number of LEDs in the current direction
        //  * @param this the sprite to move
        //  * @param distance number of leds to move, eg: 1, -1
        //  */
        // //% weight=50 help=game/move
        // //% group=Sprite
        // //% blockId=kn_game_move_sprite block="%sprite|move by %distance" blockGap=8
        // //% parts="ledmatrix"
        // public move(distance: number): void {control.panic(700);}

        // /**
        //  * Turn the sprite 90 degrees in the given direction
        //  * @param this the sprite to trun
        //  * @param direction left or right
        //  */
        // //% weight=49 help=game/turn
        // //% group=Sprite
        // //% blockId=kn_game_turn_sprite block="%sprite|turn %direction"
        // public turn(direction: kngamezip.Direction): void {control.panic(700);}

        // /**
        //  * Sets a property of the sprite
        //  * @param property the name of the property to change
        //  * @param the updated value
        //  */
        // //% weight=29 help=game/set
        // //% group=Sprite
        // //% blockId=kn_game_sprite_set_property block="%sprite|set %property|to %value" blockGap=8
        // public set(property: kngamezip.SpriteProperty, value: number): void {control.panic(700);}

        // /**
        //  * Changes a property of the sprite
        //  * @param property the name of the property to change
        //  * @param value amount of change, eg: 1
        //  */
        // //% weight=30 help=game/change
        // //% group=Sprite
        // //% blockId=kn_game_sprite_change_xy block="%sprite|change %property|by %value" blockGap=8
        // public change(property: kngamezip.SpriteProperty, value: number): void {control.panic(700);}

        // /**
        //  * Gets a property of the sprite
        //  * @param property the name of the property to change
        //  */
        // //% weight=28 help=game/get
        // //% group=Sprite
        // //% blockId=kn_game_sprite_property block="%sprite|%property"
        // public get(property: kngamezip.SpriteProperty): number {control.panic(700); return 0;}

        // /**
        //  * Reports true if sprite has the same position as specified sprite (ignores z-axis)
        //  * @param this the sprite to check overlap or touch
        //  * @param other the other sprite to check overlap or touch
        //  */
        // //% weight=20 help=game/is-touching
        // //% group=Sprite
        // //% blockId=kn_game_sprite_touching_sprite block="is %sprite|touching %other" blockGap=8
        // public isTouching(other: LedSprite): boolean {control.panic(700); return false;}

        // /**
        //  * Reports true if sprite is touching an edge
        //  * @param this the sprite to check for an edge contact
        //  * @param edge the edge to look for, eg: Any
        //  */
        // //% weight=19 help=game/is-touching-edge
        // //% group=Sprite
        // //% blockId=kn_game_sprite_touching_edge block="is %sprite|touching edge %edge" blockGap=8
        // public isTouchingEdge(edge: kngamezip.Edge): boolean {control.panic(700); return false;}

        // /**
        //  * If touching the edge of the stage and facing towards it, then turn away.
        //  * @param this the sprite to check for bounce
        //  */
        // //% weight=18 help=game/if-on-edge-bounce
        // //% group=Sprite
        // //% blockId=kn_game_sprite_bounce block="%sprite|if on edge, bounce"
        // //% parts="ledmatrix"
        // public ifOnEdgeBounce(): void {control.panic(700);}


        // /**
        //  * Join this sprite into a group.
        //  * If the sprite is already in a group, it will be removed from that group first.
        //  * @param this the sprite that should join
        //  * @param group the group to join
        //  */
        // //% weight=59 blockGap=8
        // //% group="Sprite group"
        // //% blockId=kn_game_join_group block="%sprite|join group %group"
        // public joinGroup(group: LedSpriteGroup) {
        //     if (this.group) {
        //         this.group.removeChild(this);
        //     }
        //     group.addChild(this);
        //     this.group = group;
        // }

        // /**
        //  * Leave the current group if in any.
        //  * @param this the sprite that should leave.
        //  */
        // //% weight=58 blockGap=8
        // //% group="Sprite group"
        // //% blockId=kn_game_leave_group block="%sprite|leave group"
        // public leaveGroup(): void {
        //     if (this.group) {
        //         this.group.removeChild(this)
        //         this.group = null;
        //     }
        // }

        // /**
        //  * Check whether the sprite is member of a group
        //  * If the sprite is already in a group, it will be removed from that group first.
        //  * @param this the sprite to check
        //  * @param group the group it should be in
        //  */
        // //% weight=57 blockGap=8
        // //% group="Sprite group"
        // //% blockId=kn_game_in_group block="%sprite|in group %group"
        // public inGroup(group: LedSpriteGroup): boolean {
        //     return this.group == group;
        // }
    }

    // export class LedSprite extends BaseSprite{
    export class LedSprite {
        private x: number;
        private y: number;
        private z: number;

        private direction: number;
        private brightness: number; // TODO: remove
        private color: number;
        private enabled: boolean;

        public group: LedSpriteGroup;

        constructor(x: number, y: number) {
            // super();
            this.x = Math.clamp(0, 7, x);
            this.y = Math.clamp(0, 7, y);
            this.z = 0;
            this.direction = Cardinal.East;
            this.brightness = 50;
            this.enabled = true;
            this.color = packRGB(50, 0, 0);
            _should_sort = true;
            _sprites.push(this);
            this.group = null;
        }

        public _render(): void {
            if (this.enabled) {
                // let color = (this.brightness & 0xFF) << 16;
                _display.setMatrixColor(this.x, this.y, this.color);
            }
        }

        public compare(other: LedSprite): number {
            return this.z - other.z;
        }

        public delete(): void {
            leaveGroup(this);
            this.enabled = false;
            if (_sprites.removeElement(this)) {
                render();
                _should_render = true;
            }
        }

        public isDeleted(): boolean {
            return !this.enabled;
        }

        public move(distance: number): void {
            switch (this.direction) {
                case Cardinal.East:
                    this.x += distance;
                    break;
                case Cardinal.South:
                    this.y += distance;
                    break;
                case Cardinal.West:
                    this.x -= distance;
                    break;
                case Cardinal.North:
                    this.y -= distance;
                    break;
            }
            this.x = Math.clamp(0, 7, this.x);
            this.y = Math.clamp(0, 7, this.y);
                _should_render = true;
        }

        public turn(direction: kngamezip.Direction): void {
            switch (direction) {
                case kngamezip.Direction.Right:
                    this.direction = (this.direction + 1) & 3; // = modulus with 4
                    break;
                case kngamezip.Direction.Left:
                    this.direction = (this.direction + 3) & 3; // Easier to turn 270 than handle negatives
                    break;
                case kngamezip.Direction.Around:
                    this.direction = (this.direction + 2) & 3;
                    break;
            }
        }

        public set(property: kngamezip.SpriteProperty, value: number): void {
            switch (property) {
                case kngamezip.SpriteProperty.X:
                    this.x = Math.clamp(0, 7, value);
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Y:
                    this.y = Math.clamp(0, 7, value);
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Z:
                    this.z = value;
                    _should_sort = true;
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Direction:
                    this.direction = value; // TODO: is this the best way to dot this?!
                    break;
                case kngamezip.SpriteProperty.Brightness:
                    this.brightness = Math.clamp(0, 255, value);
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Color:
                    this.color = value >> 0;
                    _should_render = true;
                    break;
            }
        }

        public change(property: kngamezip.SpriteProperty, value: number): void {
            switch (property) {
                case kngamezip.SpriteProperty.X:
                    this.x = Math.clamp(0, 7, this.x + value);
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Y:
                    this.y = Math.clamp(0, 7, this.y + value);
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Z:
                    this.z += value;
                    _should_sort = true;
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Direction:
                    this.direction += value; // TODO: is this the best way to dot this?!
                    break;
                case kngamezip.SpriteProperty.Brightness:
                    this.brightness = Math.clamp(0, 255, this.brightness + value);
                    _should_render = true;
                    break;
                case kngamezip.SpriteProperty.Color:
                    // this.color = blend(this.color, value, 0.5);
                    _should_render = true;
                    break;
            }
        }

        public get(property: kngamezip.SpriteProperty): number {
            switch (property) {
                case kngamezip.SpriteProperty.X:
                    return this.x;
                case kngamezip.SpriteProperty.Y:
                    return this.y;
                case kngamezip.SpriteProperty.Z:
                    return this.z;
                case kngamezip.SpriteProperty.Direction:
                    return this.direction;
                case kngamezip.SpriteProperty.Brightness:
                    return this.brightness;
                case kngamezip.SpriteProperty.Color:
                    return this.color;
            }
        }

        public isTouching(other: LedSprite): boolean {
            // TODO: Name this something more appropriate, like onTopOf, isTouchingEdge is next to, this is not!?!
            return this.enabled && other.enabled && this.x == other.x && this.y == other.y;
        }

        public isTouchingEdge(edge: kngamezip.Edge): boolean {
            if (!this.enabled) {
                return false;
            }
            switch (edge) {
                case kngamezip.Edge.Top:
                    return this.y == 0;
                case kngamezip.Edge.Right:
                    return this.x == 7;
                case kngamezip.Edge.Bottom:
                    return this.y == 7;
                case kngamezip.Edge.Left:
                    return this.x == 0;
                case kngamezip.Edge.Any:
                    return this.y == 0 || this.x == 7 || this.y == 7 || this.x == 0;
                default:
                    return false;
            }
        }

        public ifOnEdgeBounce(): void {
            switch (this.direction) {
                case Cardinal.East:
                    if (this.x == 7) {
                        this.direction = Cardinal.West;
                    }
                    break;
                case Cardinal.South:
                    if (this.y == 7) {
                        this.direction = Cardinal.North;
                    }
                    break;
                case Cardinal.West:
                    if (this.x == 0) {
                        this.direction = Cardinal.East;
                    }
                    break;
                case Cardinal.North:
                    if (this.y == 0) {
                        this.direction = Cardinal.South;
                    }
                    break;
            }
        }
    }

    /**
     * Creates a new LED sprite group
     */
    //% weight=60 blockGap=8
    //% group="Sprite group"
    //% blockId=kn_game_create_sprite_group block="create sprite group"
    export function createSpriteGroup(): LedSpriteGroup {
        init();
        return new LedSpriteGroup();
    }

    // /**
    //  * Loop through a sprite group and execute a block for each child
    //  * @param group the sprite group to loop over
    //  * @param sprite the child sprite for use in the block
    //  */
    // //% block="Loop through $group|using $child"
    // //% group="Sprite group"
    // //% blockId=kn_game_loop_sprite_group
    // //% instance.shadow=variables_get
    // //% instance.defl=sprite
    // //% draggableParameters=variable
    // //% handlerStatement=1
    // export function loop_through(group: LedSpriteGroup, handler: (child: BaseSprite) => void) {
    //     for (let child of group.children) {
    //         handler(child);
    //     }
    // }


    // export class LedSpriteGroup extends BaseSprite {
    export class LedSpriteGroup {
        public children: (LedSprite|LedSpriteGroup)[];
        public group: LedSpriteGroup;
        // private enabled: boolean;
        constructor() {
            // super();
            // this.enabled = true;
            this.children = [];
            this.group = null;
        }

        /**
         * Add a child to the member.
         * It is up to the caller to ensure that the childs group is set correctly.
         * Does not touch child in any way
         * (ie. does not change its group group).
         *
         * This is intentionally not a block, use the joinGroup instead.
         */
        public addChild(child: LedSprite|LedSpriteGroup) {
            this.children.push(child);
        }

        /**
         * Remove a child from the children.
         * If the child is not a member, nothing is done
         * Does not touch child in any way
         * (ie. does not change its group group).
         *
         * This is intentionally not a block, use the leaveGroup instead.
         */
        public removeChild(child: LedSprite|LedSpriteGroup) {
            let index = this.children.indexOf(child);
            if (index >= 0) {
                this.children.slice(index, 1);
            }
        }

        public delete(): void {
            for (let child of this.children) {
                child.delete();
            }
        }

        public isDeleted(): boolean {
            return this.children.length == 0;
        }

        public move(distance: number): void {
            for (let child of this.children) {
                child.move(distance);
            }
        }

        public turn(direction: kngamezip.Direction): void {
            for (let child of this.children) {
                child.turn(direction);
            }
        }

        public set(property: kngamezip.SpriteProperty, value: number): void {
            for (let child of this.children) {
                child.set(property, value);
            }
        }

        public change(property: kngamezip.SpriteProperty, value: number): void {
            for (let child of this.children) {
                child.change(property, value);
            }
        }

        public get(property: kngamezip.SpriteProperty): number {
            // TODO: ???
            control.panic(701);
            return -1;
        }

        public isTouching(other: LedSprite): boolean {
            for (let child of this.children) {
                if (child.isTouching(other)) {
                    return true;
                }
            }
            return false;
        }

        public isTouchingEdge(edge: kngamezip.Edge): boolean {
            for (let child of this.children) {
                if (child.isTouchingEdge(edge)) {
                    return true;
                }
            }
            return false;
        }

        public ifOnEdgeBounce(): void {
            // TODO: implement
            control.panic(701);
        }
    }

    /**
     * Adds points to the current score and shows an animation
     * @param points amount of points to change, eg: 1
     */
    //% weight=10 help=game/add-score
    //% group=Game
    //% blockId=kn_game_change_score block="change score by|%points" blockGap=8
    //% parts="ledmatrix"
    export function changeScore(points: number): void {
        // TODO: decide on animation here
        setScore(_score + points);
    }
    /**
     * Sets the current score value
     * @param points new score value.
     */
    //% blockId=kn_game_set_score block="set score %points" blockGap=8
    //% group=Game
    //% weight=10 help=game/set-score
    export function setScore(points: number): void {
        _score = points;
        if (_score < 0) {
            _score = 0;
        }
    }
    /**
     * Gets the current score
     */
    //% weight=9 help=game/score
    //% group=Game
    //% blockId=kn_game_score block="score" blockGap=8
    export function score(): number {
        return _score;
    }

    /**
     * Change life by some amount
     * @param lives amount of lives to add
     */
    //% weight=10 help=game/add-life
    //% group=Game
    //% blockId=kn_game_change_life block="add life %lives" blockGap=8
    export function changeLife(lives: number): void {
        setLife(_life + lives);
    }

    /**
     * Sets the current life value
     * @param lives current life value
     */
    //% weight=10 help=game/set-life
    //% group=Game
    //% blockId=kn_game_set_life block="set life %value" blockGap=8
    export function setLife(lives: number): void {
        _life += lives;
        if (_life <= 0) {
            _life = 0
            gameOver();
        }

    }

    /**
     * Gets the current life
     */
    //% weight=10
    //% group=Game
    //% blockId=kn_game_score block="life" blockGap=8
    export function life(): number {
        return _life;
    }


    /**
     * Displays a game over animation and the score.
     */
    //% weight=8 help=game/game-over
    //% group=Game
    //% blockId=kn_game_game_over block="game over"
    //% parts="ledmatrix"
    export function gameOver(): void {
        if (!_isGameover) {
            _isGameover = true;
            led.stopAnimation();
            led.setBrightness(255);
            while (true) {
                for (let i = 0; i < 8; i++) {
                    basic.clearScreen();
                    basic.pause(100);
                    basic.showLeds(`1 1 1 1 1
1 1 1 1 1
1 1 1 1 1
1 1 1 1 1
1 1 1 1 1`,
                                   300);
                }
                basic.showAnimation(`1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 0 1 1 0 0 0 1 0 0 0 0 0 0 0 0 0
1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 0 1 1 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
1 1 0 1 1 1 0 0 0 1 1 0 0 0 1 1 0 0 0 1 1 0 0 0 1 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 0 0 0 1 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 0 0 0 1 1 0 0 0 0 1 0 0 0 0 0`,
                                    100);
                for (let i = 0; i < 3; i++) {
                    basic.showString(" GAMEOVER ", 100);
                    basic.showNumber(_score, 150);
                    basic.showString(" ", 150);
                }
            }
        } else {
            // already gameover, animation running in another fiber
            while (true) {
                basic.pause(10000);
            }
        }
    }

    /**
     * Gets the RGB value of a known color
     */
    //% group=Color
    //% weight=2 blockGap=8
    //% blockId="kn_zip_colors" block="%color"
    export function color(color: ZipLedColors): number {
        return color;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 50
     * @param green value of the green channel between 0 and 255. eg: 00
     * @param blue value of the blue channel between 0 and 255. eg: 00
     */
    //% group=Color
    //% weight=1
    //% blockId="kn_zip_rgb" block="red %red|green %green|blue %blue"
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }
    /**
     * Blends togetehr the two colors.
     * @param color1 The first color to blend, eg: 0
     * @param color2 The second color to blend, eg: 0
     * @param ratio The amount of color2 to use between 0.0 and 1.0, eg: 0.5
     */
    //% group=Color
    //% weight=1
    //% blockId="kn_blend" block="blend %color1|with %color2|using ratio %ratio"
    export function blend(color1: number, color2: number, ratio: number): number {
        let r1 = unpackR(color1);
        let g1 = unpackG(color1);
        let b1 = unpackB(color1);
        let r2 = unpackR(color2);
        let g2 = unpackG(color2);
        let b2 = unpackB(color2);
        return packRGB(
            (1.0 - ratio) * r1 + ratio * r2,
            (1.0 - ratio) * g1 + ratio * g2,
            (1.0 - ratio) * b1 + ratio * b2,
        );
    }

    function packRGB(r: number, g: number, b: number): number {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }
    function unpackR(rgb: number): number {
        return (rgb >> 16) & 0xFF;
    }
    function unpackG(rgb: number): number {
        return (rgb >> 8) & 0xFF;
    }
    function unpackB(rgb: number): number {
        return (rgb) & 0xFF;
    }

    /**
     * Determines if a :GAME ZIP64 button is pressed
     * @param button press to be checked
     */
    //% group=Zip
    //% blockId="kn_zip64_ispressed" block="button %button|is pressed"
    //% button.fieldEditor="gridpicker" button.fieldOptions.columns=3
    //% weight=95 blockGap=8
    export function buttonIsPressed(button: GAME_ZIP64.ZIP64ButtonPins): boolean {
        const pin = <DigitalPin><number>button;
        pins.setPull(pin, PinPullMode.PullUp);
        return pins.digitalReadPin(pin) == 0;
    }

    /**
     * Do something when one of the :GAME ZIP64 Buttons is pressed
     * @param button press to be checked
     * @param event happening on the button, eg: click
     */
    //% group=Zip
    //% blockId="kn_button_press_on_event" block="on button %button|press %event"
    //% button.fieldEditor="gridpicker" button.fieldOptions.columns=3
    //% weight=93 blockGap=8
    export function onButtonPress(button: GAME_ZIP64.ZIP64ButtonPins, event: GAME_ZIP64.ZIP64ButtonEvents, handler: Action) {
        // This does some internal stuff, so we just delegate
        GAME_ZIP64.onButtonPress(button, event, handler);
    }


    /**
     * Run vibration motor for a particular length of time
     * @param duration is the length of time the motor will run in ms, eg: 100
     */
    //% group=Zip
    //% blockId="kn_run_motor" block="Run vibration for %run_time|ms" icon="\uf080"
    //% weight=92 blockGap=8
    export function runMotor(duration: number): void {
        pins.digitalWritePin(DigitalPin.P1, 1);
        basic.pause(duration);
        pins.digitalWritePin(DigitalPin.P1, 0);
    }


    /**
     * Registers code to run when the radio receives a number.
     */
    //% blockId=kn_radio_on_number_drag block="on radio received" blockGap=16
    //% draggableParameters=reporter
    export function onReceivedNumber(cb: (receivedNumber: number) => void) {
        cb(17);
    }

    /**
     * Testing out blocks
     */
    //% block="over $instance|with $num|and $boo"
    //% blockId=kn_example_handler
    //% instance.shadow=variables_get
    //% instance.defl=sprite
    //% draggableParameters=variable
    //% handlerStatement=1
    export function exampleHandler(instance: LedSprite, handler: (num: number, boo: boolean) => void) {

    }
}
