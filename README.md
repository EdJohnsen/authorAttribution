# authorAttribution

All files within this repository are licensed via GNU LGPLv3

## Advancements to the Realm of Deep-Cloning - Instruction Functions
Instruction functions are a two-pass family of functions (like the Stringify and Parse, or Flatten and Unflatten families) that supports multi-clone acceleration. 

### Defining Multi-Deep-Clone Acceleration by Example
Whereas JSON.parse(JSON.stringify(obj)) runs at appx 2n,

let stringy = JSON.stringify(obj);

JSON.parse(stringy) runs at approximately 1+n. 

(where n is the desired number of clones of a single object)


### Filled Instruction Functions
Ideal for accelerating the multi-cloning process of an individual object, Filled Instruction Functions generate Filled Instruction Objects (deeply-decorated deep-clones). The decorations in a Filled Instruction Object can contain pre-solved conditionals related to object type, and -- when utilizing abstract-mixin deep-cloning -- user choice decorations. Additionally, since ES5, Heavy Instruction Objects contain descriptors. (As of 7/24/2021, all solutions in this repository are Filled Instruction Functions.)

### Empty Instruction Functions
Empty Instruction Functions are the only known-to-me solution for accelerating the deep-cloning process of separate, but structurally identical objects. Empty Instruction Functions generate Empty Instruction Objects (deeply-decorated, but otherwise valueless deep-clones). Utilizing pre-solved object-type conditionals and user choice decorations, Empty Instruction Functions are a bit more complex than Filled Instruction Functions, but surely make up for it by being more flexible.

### For Ultimate Speed
Instruction Objects can be decorated with choices to use .slice, or Object.assign, or Object.create for flat branches within deep-objects... but only when cross-frame deep-cloning is unneeded. In the single-frame environment, the acceleration available from Instruction Functions can outpace even the acceleration of the JSON solution; yielding multi-cloning speeds as much as 10 times faster than the accelerated JSON solution.
