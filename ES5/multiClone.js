var multiClone = (function(){/*GNU LGPLv3 (C) July 2021 Ed Johnsen*/

	// GENERAL SUPPORT VARIABLES
	var nameRE = /^\s*function ([^ (]*)/;

	var stack = new Array(1000);

	var stackLength = 0;

	var errorConstructor = {
		"Error":true,
		"EvalError":true,
		"RangeError":true,
		"ReferenceError":true,
		"SyntaxError":true,
		"TypeError":true,
		"URIError":true
	};

	// GENERAL SUPPORT FUNCTIONS
	function checkStack(obj){

		for(var i=0; i<stackLength; i++){

			if(obj === stack[i])
				return true;
		}

		return false;
	}

	function stackPush(obj){

		stack[stackLength] = obj;

		stackLength++;
	}

	function stackPop(){

		stackLength--;
	}


	function makeInstructions(obj){

		if(
			typeof obj === "object" &&
			obj !== null &&
			!checkStack(obj)
		){

			stackPush(obj);

			var cnstrctr = obj.constructor;

			var conName = cnstrctr.name || 
				cnstrctr.toString().match(nameRE)[1];

			var instructions = {

				conName:conName,

				cnstrctr:cnstrctr
			};

			var isCustom;


			if( conName === "Object"){}

			else if(conName === "Date")
				instructions.value = obj.getTime();

			else if(conName === "RegExp")
				instructions.value = obj;

			else if( conName.indexOf("Array") > -1 )
				instructions.length = obj.length;

			else if( conName === "Boolean" || conName === "Number" || conName === "String" )
				instructions.value = obj.valueOf();

			else if( conName.indexOf("Error") > -1 ){

				if(obj.stack){

					instructions.message = obj.message;

					instructions.stack = obj.stack;
				}

				else
					instructions.message = obj.message + " _INACCURATE OR MISSING STACK-TRACE_ ";
			}

			else
				isCustom = true;

			var props,
				prop,
				descriptor,
				i = 0,
				imax = 0,
				flatDescriptors = [],
				deepDescriptors = [],
				deepValues = [],
				deleteKeys = [];


			if(isCustom){

				props = Object.getOwnPropertyNames( new cnstrctr() );

				imax = props.length;

				for(; i<imax; i++)
					if( !( props[i] in obj ) )
						deleteKeys.push( props[i] );
			}



			props = Object.getOwnPropertyNames(obj);

			imax = props.length;

			i = 0;

			for(; i<imax; i++){

				prop = props[i];

				descriptor = Object.getOwnPropertyDescriptor( obj, prop );
					
				if(
					descriptor.value &&
					typeof descriptor.value === "object" &&
					descriptor.value !== null &&
					!checkStack( descriptor.value )
				){

					deepDescriptors.push( [prop, descriptor] );

					deepValues.push( makeInstructions( descriptor.value ) );
				}
				else{

					flatDescriptors.push( [prop, descriptor] );
				}
				
			}

			instructions.flatLength = flatDescriptors.length;

			instructions.deepLength = deepDescriptors.length;
			
			instructions.deleteLength = deleteKeys.length;

			instructions.deepDescriptors = deepDescriptors;

			instructions.deepValues = deepValues;

			instructions.flatDescriptors = flatDescriptors;

			instructions.deleteKeys = deleteKeys;

			stackPop();

			return instructions;
		}

		return obj;
	}


	function useInstructions(instructions){

		if(
			typeof instructions === "object" &&
			instructions !== null
		){

			var newObj,
				i = 0,
				key,
				descriptor,
				value;

			if( instructions.value )
				newObj = new instructions.cnstrctr( instructions.value );

			else if( instructions.length )
				newObj = new instructions.cnstrctr( instructions.length );

			else if( instructions.message ){

				newObj = new instructions.cnstrctr( instructions.message );

				newObj.stack = instructions.stack;
			}

			else
				newObj = new instructions.cnstrctr();


			for(; i<instructions.deleteLength; i++)
				delete newObj[ instructions.deleteKeys[i] ];


			i = 0;

			for(; i<instructions.flatLength; i++){

				key = instructions.flatDescriptors[i][0];

				descriptor = instructions.flatDescriptors[i][1];


				Object.defineProperty( newObj, key, descriptor );
			}


			i = 0;

			for(; i<instructions.deepLength; i++){

				key = instructions.deepDescriptors[i][0];

				descriptor = instructions.deepDescriptors[i][1];

				value = instructions.deepValues[i];


				Object.defineProperty( newObj, key, descriptor );

				newObj[key] = useInstructions(value);
			}


			return newObj;
		}

		return instructions;
	}


	function multiClone(obj, n){

		var parsed = parseFloat(n);

		var isNumKey = parsed === Math.floor(parsed) && 
				isFinite(parsed);

		n = isNumKey 
			? Math.max( Math.floor(n), 1 )
			: 1;

		var returnArr = new Array(n);

		var instructions = makeInstructions(obj);

		for(var i=0; i<n; i++)
			returnArr[i] = useInstructions(instructions);

		return returnArr;
	}


	return multiClone;
})();
