 /**
 * This library is based on the build in game.ts and the zip64.ts libraries.
 * It is distributed under the MIT license
 */


/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf11b" block="KN gamezip"
namespace kngamezip {
    const USER_ERROR = 700;
    const INTERNAL_ERROR = 711;
    const NOT_IMPLEMENTED_ERROR = 722;

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
        //% block=north
        North,
        //% block=east
        East,
        //% block=south
        South,
        //% block=west
        West,
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
        //% block=North
        North,
        //% block=east
        East,
        //% block=south
        South,
        //% block=west
        West,

        //% block=front
        Front,
        //% block=right
        Right,
        //% block=back
        Back,
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
        //% block=color
        Color,
        //% block="custom A"
        CustomA,
        //% block="custom B"
        CustomB,
        //% block="custom C"
        CustomC,

    }

    export enum Extract {
        //% block=last
        Last,
        //% block=first
        First,
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
        return new LedSprite(true, x, y);
    }

    /**
     * Creates a new LED sprite group
     */
    //% weight=60 blockGap=8
    //% group="Sprite group"
    //% blockId=kn_game_create_sprite_group block="create sprite group"
    export function createSpriteGroup(): LedSprite {
        init();
        return new LedSprite(false, 0, 0);
    }

    /**
     * This is implemented in a not so optimal way.
     * Normally I would create two classes LedSprite to model a single pixel and LedSpriteGroup to server as a group of LedSprites / LedSpriteGroups.
     * A common Sprite interface could be used for the two.
     * Unfortunately microbit does not support defining blocks on interfaces.
     * Instead I tried with a common BaseSprite class, not to be instanciated, but again microbit has problems when variables does not have a single type.
     * Even when trying with functions that takes a LedSprite | LedSpriteGroup union it failed.
     * The code worked, but when turning it into blocks it rewrote the code with a type error.
     * As a solution the two classes has been combined into one common LedSprite.
     * This class can be used in two diferent ways, either as a single pixel, or as a group.
     * When creating a new instance the "mode" is selected, it will then act as either of the two types.
     */
    export class LedSprite {
        // SHARED ATTRIBUTES:
        private is_sprite: boolean; // If not, it is a group
        public group: LedSprite; // The group must be an instance of group

        // SPRITE ATTRIBUTES:
        private x: number;
        private y: number;
        private z: number;

        private direction: number;
        private color: number;
        private enabled: boolean;

        private customA: number;
        private customB: number;
        private customC: number;

        // GROUP ATTRIBUTES:
        public children: LedSprite[];


        constructor(is_sprite: boolean, x: number, y: number) {
            this.is_sprite = is_sprite;
            this.group = null;

            if (this.is_sprite) {
                this.x = Math.clamp(0, 7, x);
                this.y = Math.clamp(0, 7, y);
                this.z = 0;
                this.direction = Cardinal.East;
                this.color = packRGB(50, 0, 0);
                this.enabled = true;
                this.customA = 0;
                this.customB = 0;
                this.customC = 0;
                _should_sort = true;
                _sprites.push(this);

                this.children = null;
            } else {
                this.children = [];
            }
        }

        public _render(): void {
            if (this.is_sprite) {
                if (this.enabled) {
                    _display.setMatrixColor(this.x, this.y, this.color);
                }
            } else {
                control.panic(USER_ERROR);
            }
        }

        public compare(other: LedSprite): number {
            if (this.is_sprite) {
                return this.z - other.z;
            } else {
                control.panic(USER_ERROR);
                return -1;
            }
        }

        /**
         * Deletes the sprite from the game engine. The sprite will no longer appear on the screen or interact with other sprites.
         * @param this sprite to delete
         */
        //% weight=59 blockGap=8 help=game/delete
        //% group=Sprite
        //% blockId="kn_game_delete_sprite" block="delete %this(sprite)"
        public delete(): void {
            // if (this.is_sprite) {
            //     this.leaveGroup();
            //     this.enabled = false;
            //     if (_sprites.removeElement(this)) {
            //         _should_render = true;
            //         // render();
            //     }
            // } else {
            //     this.leaveGroup();
            //     for (let child of this.children) {
            //         child.delete();
            //     }
            // }
            if (this.is_sprite) {
                this.leaveGroup(); // Ensure group is left when not doing recursive from above
            }
            this._delete();
            _should_render = true;
        }
        private _delete(): void {
            // Shouldn't use leaveGroup() in a recursive function, as that will modify the array being traversed.
            if (this.is_sprite) {
                this.group = null;
                this.enabled = false;
                _sprites.removeElement(this);
            } else {
                this.group = null;
                for (let child of this.children) {
                    child._delete();
                }
                this.children = [];
            }
        }

        /**
         * Reports whether the sprite has been deleted from the game engine.
         * @param this sprite to delete
         */
        //% weight=58 help=game/is-deleted
        //% group=Sprite
        //% blockId="kn_game_sprite_is_deleted" block="is %sprite|deleted"
        public isDeleted(): boolean {
            if (this.is_sprite) {
                return !this.enabled;
            } else {
                return this.children.length == 0;
            }
        }

        /**
         * Move a certain number of LEDs in the current direction
         * @param this the sprite to move
         * @param distance number of leds to move, eg: 1, -1
         */
        //% weight=50 help=game/move
        //% group=Sprite
        //% blockId=kn_game_move_sprite block="%sprite|move by %distance" blockGap=8
        //% parts="ledmatrix"
        public move(distance: number): void {
            if (this.is_sprite) {
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
            } else {
                for (let child of this.children) {
                    child.move(distance);
                }
            }
        }

        /**
         * Turn the sprite 90 degrees in the given direction
         * @param this the sprite to trun
         * @param direction left or right
         */
        //% weight=49 help=game/turn
        //% group=Sprite
        //% blockId=kn_game_turn_sprite block="%sprite|turn %direction"
        public turn(direction: kngamezip.Direction): void {
            if (this.is_sprite) {
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
                    case kngamezip.Direction.North:
                        this.direction = Cardinal.North;
                        break
                    case kngamezip.Direction.East:
                        this.direction = Cardinal.East;
                        break
                    case kngamezip.Direction.South:
                        this.direction = Cardinal.South;
                        break
                    case kngamezip.Direction.West:
                        this.direction = Cardinal.West;
                        break
                }
            } else {
                for (let child of this.children) {
                    child.turn(direction);
                }
            }
        }

        /**
         * Sets a property of the sprite
         * @param property the name of the property to change
         * @param the updated value
         */
        //% weight=29 help=game/set
        //% group=Sprite
        //% blockId=kn_game_sprite_set_property block="%sprite|set %property|to %value" blockGap=8
        public set(property: kngamezip.SpriteProperty, value: number): void {
            if (this.is_sprite) {
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
                    case kngamezip.SpriteProperty.Color:
                        this.color = value >> 0;
                        _should_render = true;
                        break;
                    case kngamezip.SpriteProperty.CustomA:
                        this.customA = value;
                        break;
                    case kngamezip.SpriteProperty.CustomB:
                        this.customB = value;
                        break;
                    case kngamezip.SpriteProperty.CustomC:
                        this.customC = value;
                        break;
                }
            } else {
                for (let child of this.children) {
                    child.set(property, value);
                }
            }
        }

        /**
         * Changes a property of the sprite
         * @param property the name of the property to change
         * @param value amount of change, eg: 1
         */
        //% weight=30 help=game/change
        //% group=Sprite
        //% blockId=kn_game_sprite_change_xy block="%sprite|change %property|by %value" blockGap=8
        public change(property: kngamezip.SpriteProperty, value: number): void {
            if (this.is_sprite) {
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
                    case kngamezip.SpriteProperty.Color:
                        // this.color = blend(this.color, value, 0.5);
                        _should_render = true;
                        break;
                    case kngamezip.SpriteProperty.CustomA:
                        this.customA += value;
                        break;
                    case kngamezip.SpriteProperty.CustomB:
                        this.customB += value;
                        break;
                    case kngamezip.SpriteProperty.CustomC:
                        this.customC += value;
                        break;
                }
            } else {
                for (let child of this.children) {
                    child.change(property, value);
                }
            }
        }

        /**
         * Gets a property of the sprite
         * @param property the name of the property to change
         */
        //% weight=28 help=game/get
        //% group=Sprite
        //% blockId=kn_game_sprite_property block="%sprite|%property"
        public get(property: kngamezip.SpriteProperty): number {
            if (this.is_sprite) {
                switch (property) {
                    case kngamezip.SpriteProperty.X:
                        return this.x;
                    case kngamezip.SpriteProperty.Y:
                        return this.y;
                    case kngamezip.SpriteProperty.Z:
                        return this.z;
                    case kngamezip.SpriteProperty.Direction:
                        return this.direction;
                    case kngamezip.SpriteProperty.Color:
                        return this.color;
                    case kngamezip.SpriteProperty.CustomA:
                        return this.customA;
                    case kngamezip.SpriteProperty.CustomB:
                        return this.customB;
                    case kngamezip.SpriteProperty.CustomC:
                        return this.customC;
                }
                return -1;
            } else {
                control.panic(USER_ERROR);
                return -1;
            }
        }

        /**
         * Reports true if sprite has the same position as specified sprite (ignores z-axis)
         * @param this the sprite to check overlap or touch
         * @param other the other sprite to check overlap or touch
         */
        //% weight=20 help=game/is-touching
        //% group=Sprite
        //% blockId=kn_game_sprite_touching_sprite block="is %sprite|touching %other" blockGap=8
        public isTouching(other: LedSprite): boolean {
            // TODO: Name this something more appropriate, like onTopOf, isTouchingEdge is next to, this is not!?!
            if (this.is_sprite) {
                if (other.is_sprite) {
                    return this.enabled && other.enabled && this.x == other.x && this.y == other.y;
                } else {
                    return other.isTouching(this);
                }
            } else {
                for (let child of this.children) {
                    if (child.isTouching(other)) {
                        return true;
                    }
                }
                return false;
            }
        }

        /**
         * Reports true if after a move, sprite has the same position as specified sprite (ignores z-axis)
         * @param this the sprite to check (about to move)
         * @param other the other sprite to check (the stationary)
         */
        //% weight=20 help=game/is-about-to-hit
        //% group=Sprite
        //% blockId=kn_game_sprite_about_to_hit_sprite block="is %sprite|about to hit %other" blockGap=8
        public isAboutToHit(other: LedSprite): boolean {
            if (this.is_sprite) {
                if(other.is_sprite) {
                    let x = this.x;
                    let y = this.y;
                    switch (this.direction) {
                        case kngamezip.Cardinal.North: y--; break;
                        case kngamezip.Cardinal.East:  x++; break;
                        case kngamezip.Cardinal.South: y++; break;
                        case kngamezip.Cardinal.West:  x--; break;
                    }
                    return this.enabled && other.enabled && x == other.x && y == other.y;
                } else {
                    for (let child of other.children) {
                        if (this.isAboutToHit(child)) {
                            return true;
                        }
                    }
                    return false;
                 }
            } else {
                for (let child of this.children) {
                    if (child.isAboutToHit(other)) {
                        return true;
                    }
                }
                return false;
            }
        }

        /**
         * Reports true if sprite is touching an edge
         * @param this the sprite to check for an edge contact
         * @param edge the edge to look for, eg: Any
         */
        //% weight=19 help=game/is-touching-edge
        //% group=Sprite
        //% blockId=kn_game_sprite_touching_edge block="is %sprite|touching edge %edge" blockGap=8
        public isTouchingEdge(edge: kngamezip.Edge): boolean {
            if (this.is_sprite) {
                if (!this.enabled) {
                    return false;
                }
                switch (edge) {
                    case kngamezip.Edge.North:
                        return this.y == 0;
                    case kngamezip.Edge.East:
                        return this.x == 7;
                    case kngamezip.Edge.South:
                        return this.y == 7;
                    case kngamezip.Edge.West:
                        return this.x == 0;
                    case kngamezip.Edge.Any:
                        return this.y == 0 || this.x == 7 || this.y == 7 || this.x == 0;
                    case kngamezip.Edge.Front:
                        switch (this.direction) {
                            case kngamezip.Cardinal.North: return this.y == 0;
                            case kngamezip.Cardinal.East:  return this.x == 7;
                            case kngamezip.Cardinal.South: return this.y == 7;
                            case kngamezip.Cardinal.West:  return this.x == 0;
                        }
                    case kngamezip.Edge.Right:
                        switch (this.direction) {
                            case kngamezip.Cardinal.North: return this.x == 7;
                            case kngamezip.Cardinal.East:  return this.y == 7;
                            case kngamezip.Cardinal.South: return this.x == 0;
                            case kngamezip.Cardinal.West:  return this.y == 0;
                        }
                    case kngamezip.Edge.Back:
                        switch (this.direction) {
                            case kngamezip.Cardinal.North: return this.y == 7;
                            case kngamezip.Cardinal.East:  return this.x == 0;
                            case kngamezip.Cardinal.South: return this.y == 0;
                            case kngamezip.Cardinal.West:  return this.x == 7;
                        }
                    case kngamezip.Edge.Left:
                        switch (this.direction) {
                            case kngamezip.Cardinal.North: return this.x == 0;
                            case kngamezip.Cardinal.East:  return this.y == 0;
                            case kngamezip.Cardinal.South: return this.x == 7;
                            case kngamezip.Cardinal.West:  return this.y == 7;
                        }
                    default:
                        return false;
                }
            } else {
                for (let child of this.children) {
                    if (child.isTouchingEdge(edge)) {
                        return true;
                    }
                }
                return false;
            }
        }

        /**
         * If touching the edge of the stage and facing towards it, then turn away.
         * @param this the sprite to check for bounce
         */
        //% weight=18 help=game/if-on-edge-bounce
        //% group=Sprite
        //% blockId=kn_game_sprite_bounce block="%sprite|if on edge, bounce"
        //% parts="ledmatrix"
        public ifOnEdgeBounce(): void {
            if (this.is_sprite) {
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
            } else {
                let result = this._ifOnEdgeBounce();
                if (result !== null) {
                    this.set(kngamezip.SpriteProperty.Direction, result);
                }
            }
        }
        private _ifOnEdgeBounce(): number {
            // Helper to get the desired direction
            // If there are more than one direction to bounce in, the first will be chosen.
            if (this.is_sprite) {
                switch (this.direction) {
                    case Cardinal.East:
                        if (this.x == 7) {
                            return Cardinal.West;
                        }
                        break;
                    case Cardinal.South:
                        if (this.y == 7) {
                            return Cardinal.North;
                        }
                        break;
                    case Cardinal.West:
                        if (this.x == 0) {
                            return Cardinal.East;
                        }
                        break;
                    case Cardinal.North:
                        if (this.y == 0) {
                            return Cardinal.South;
                        }
                        break;
                }
                return null;
            } else {
                for (let child of this.children) {
                    let result = child._ifOnEdgeBounce();
                    if (result !== null) {
                        return result;
                    }
                }
                return null;
            }
        }


        /**
         * Join a sprite into this group.
         * If the sprite is already in a group, it will be removed from that group first.
         * @param this the group to join
         * @param sprite the sprite that should join
         */
        //% weight=59 blockGap=8
        //% group="Sprite group"
        //% blockId=kn_game_join_group block="into %group|insert sprite %sprite"
        public joinGroup(sprite: LedSprite): void {
            if (this.is_sprite) {
                control.panic(USER_ERROR);
            }
            if (sprite.group) {
                let removed = sprite.group.children.removeElement(sprite);
                if (!removed) {
                    control.panic(INTERNAL_ERROR);
                }
            }
            this.children.push(sprite);
            sprite.group = this;
        }

        /**
         * Leave the current group if in any.
         * @param this the sprite that should leave.
         */
        //% weight=58 blockGap=8
        //% group="Sprite group"
        //% blockId=kn_game_leave_group block="%sprite|leave group"
        public leaveGroup(): void {
            if (this.group) {
                this.group.children.removeElement(this)
                this.group = null;
            }
        }

        /**
         * Check whether the sprite is member of a group
         * If the sprite is already in a group, it will be removed from that group first.
         * @param this the sprite to check
         * @param group the group it should be in
         */
        //% weight=57 blockGap=8
        //% group="Sprite group"
        //% blockId=kn_game_in_group block="%sprite|in group %group"
        public inGroup(group: LedSprite): boolean {
            if (group.is_sprite) {
                control.panic(USER_ERROR);
                return false;
            } else {
                return this.group == group;
            }
        }

        /**
         * Get the last/first inserted sprite/group in this group
         * @param this the group to look in
         * @param where where to get it from
         */
        //% weight=58 blockGap=8
        //% group="Sprite group"
        //% blockId=kn_game_extract block="%group| get %where"
        public get_sprite(where: kngamezip.Extract): LedSprite {
            if (this.is_sprite) {
                control.panic(USER_ERROR);
                return null;
            } else {
                switch (where) {
                    case kngamezip.Extract.Last:
                        return this.children[this.children.length - 1];
                    case kngamezip.Extract.First:
                        return this.children[0];
                }
                return null;
            }
        }

         /**
         * Get the last inserted sprite/group in this group
         * @param this the group to look in
         */
        //% weight=58 blockGap=8
        //% group="Sprite group"
        //% blockId=kn_game_last block="%group| get last"
        public last(): LedSprite {
            if (this.is_sprite) {
                control.panic(USER_ERROR);
                return null;
            } else {
                return this.children[this.children.length - 1];
            }
        }

        public loop_through(handler: (child: LedSprite) => void): void {
            if (this.is_sprite) {
                control.panic(USER_ERROR);
            }
            let copy = this.children.slice(); // Loop through a copy, in case handler modifies the group
            for (let child of copy) {
                // The child could be deleted by the handler
                if (child.enabled) {
                    handler(child);
                }
            }
        }
    }
    /**
     * Loop through a sprite group and execute a block for each child
     * @param this the sprite group to loop over
     * @param sprite the child sprite for use in the block
     */
    //% block="Loop through $instance|using variable $child"
    //% group="Sprite group"
    //% blockId=kn_game_loop_sprite_group
    //% instance.shadow=variables_get
    //% instance.defl=group
    //% draggableParameters=variable
    //% handlerStatement=1
    export function loop_through(instance: LedSprite, handler: (child: LedSprite) => void): void {
        instance.loop_through(handler);
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
    //% blockId=kn_game_life block="life" blockGap=8
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
     * Set the brightness of the ZIP64 display. This flag only applies to future operation.
     * @param brightness a measure of LED brightness in 0-255. eg: 255
     */
    //% group=Display
    //% blockId="kn_zip64_display_set_brightness" block="set brightness to %brightness" blockGap=8
    //% weight=95
    export function setBrightness(brightness: number): void {
        init();
        _display.setBrightness(brightness);
    }


    // /**
    //  * Registers code to run when the radio receives a number.
    //  */
    // //% blockId=kn_radio_on_number_drag block="on radio received" blockGap=16
    // //% draggableParameters=reporter
    // export function onReceivedNumber(cb: (receivedNumber: number) => void) {
    //     cb(17);
    // }

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
