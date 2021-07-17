var multiClone = (function(){

	// GENERAL SUPPORT VARIABLES
	var nameRE = /^\s*function ([^ (]*)/;

	var stack = new Array(1000);

	var stackLength = 0;

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

	// TYPE SUPPORT FUNCTIONS
	function makeErrorInstructions(err){

		var message,
			stack = false,
			flatObj = {},
			deepObj = {},
			errConstructor = err.constructor,
			key;


		if(err.stack){ // not ES3; but in FireFox 2

			message = err.message;

			stack = err.stack;
		}

		else
			message = err.message + " INACCURATE OR MISSING STACK-TRACE";


		for(key in err){

			if(
				typeof err[key] === "object" &&
				err[key] !== null &&
				!checkStack( err[key] )
			)
				deepObj[key] = makeInstructions( err[key] );

			else
				flatObj[key] = err[key];
		}


		return{

			func:useErrorInstructions,

			errConstructor:errConstructor,

			message:message,
			stack:stack,

			deepObj:deepObj,
			flatObj:flatObj
		}
	}
	function useErrorInstructions(instructions){

		var newErr = new instructions.errConstructor( instructions.message ),
			key;

		if(instructions.stack)
			newErr.stack = instructions.stack;

		for(key in instructions.deepObj)
			newErr[key] = useInstructions( instructions.deepObj[key] );

		for(key in instructions.flatObj)
			newErr[key] = instructions.flatObj[key];

		return newErr;
	}

	function makeObjectInstructions(obj){

		var flatObj = {},
			deepObj = {},
			deleteObj = [],
			objConstructor = obj.constructor,
			key;

		var conName = objConstructor.name || 
			objConstructor.toString().match(nameRE)[1];

		if(conName !== "Object"){

			var cloneObj = new objConstructor();

			for(var cKey in cloneObj)
				if( 
					cloneObj.hasOwnProperty(cKey) && 
					!obj.hasOwnProperty(cKey)
				)
					deleteObj.push(cKey);
		}


		for (key in obj) 
			if( obj.hasOwnProperty(key) ){

				if(
					typeof obj[key] === 'object' &&
					obj[key] !== null &&
					!checkStack( obj[key] )
				)
					deepObj[key] = makeInstructions( obj[key] );

				else
					flatObj[key] = obj[key];
			}


		return{

			func:useObjectInstructions,

			objConstructor:objConstructor,

			flatObj:flatObj,
			deepObj:deepObj,
			deleteObj:deleteObj
		}
	}
	function useObjectInstructions(instructions){

		var newObj = new instructions.objConstructor(),
			key;

		for(var i=0, imax = instructions.deleteObj.length; i<imax; i++)
			delete newObj[ instructions.deleteObj[i] ];

		for(key in instructions.flatObj)
			newObj[key] = instructions.flatObj[key];

		for(key in instructions.deepObj)
			newObj[key] = useInstructions( instructions.deepObj[key] );

		return newObj;
	}

	function makeArrayInstructions(arr){

		var flatArr = [],
			deepArr = [],
			arrLength = arr.length,
			arrConstructor = arr.constructor,

			flatObj = {},
			deepObj = {},
			i=0,
			key;


		for(; i<arrLength; i++){

			if(
				typeof arr[i] === 'object' &&
				arr[i] !== null && 
				!checkStack(arr[i])
			)
				deepArr[i] = makeInstructions( arr[i] );

			else
				flatArr[i] = arr[i];
		}


		for(key in arr)
			if(
				!(key in deepArr) &&
				!(key in flatArr)
			){

				if(
					typeof arr[key] === 'object' &&
					arr[key] !== null && 
					!checkStack(arr[key])
				)
					deepObj[key] = makeInstructions( arr[key] );

				else
					flatObj[key] = arr[key];
			}


		return{

			func:useArrayInstructions,

			arrConstructor:arrConstructor,
			arrLength:arrLength,

			flatArr:flatArr,
			deepArr:deepArr,
			flatObj:flatObj,
			deepObj:deepObj
		}

	}
	function useArrayInstructions(instructions){

		var newArr = new instructions.arrConstructor( instructions.arrLength ),
			key;

		for(key in instructions.flatArr)
			newArr[key] = instructions.flatArr[key];

		for(key in instructions.deepArr)
			newArr[key] = useInstructions( instructions.deepArr[key] );

		for(key in instructions.flatObj)
			newArr[key] = instructions.flatObj[key];

		for(key in instructions.deepObj)
			newArr[key] = useInstructions( instructions.deepObj[key] );

		return newArr;
	}

	function makeStringInstructions(obj){

		var value = obj.valueOf(),
			primObjConstructor = obj.constructor,
			flatObj = {},
			deepObj = {},
			key;

		var tempString = new String(value);

		for(key in obj)
			if( !(key in tempString) ){

				if(
					typeof obj[key] === "object" &&
					obj[key] !== null &&
					!checkStack( obj[key] )
				)
					deepObj[key] = makeInstructions( obj[key] );

				else
					flatObj[key] = obj[key];
			}

		return{

			func:usePrimitiveObjectInstructions,

			primObjConstructor:primObjConstructor,

			value:value,

			flatObj:flatObj,

			deepObj:deepObj
		}
	}

	function usePrimitiveObjectInstructions(instructions){

		var newPrimitiveObject = new instructions.primObjConstructor( instructions.value ),
			key;

		for(key in instructions.flatObj)
			newPrimitiveObject[key] = instructions.flatObj[key];

		for(key in instructions.deepObj)
			newPrimitiveObject[key] = useInstructions( instructions.deepObj[key] );

		return newPrimitiveObject;
	}

	// MAIN FUNCTIONS
	function makeInstructions(obj){

		if(
			typeof obj === "object" &&
			obj !== null &&
			!checkStack(obj)
		){

			stackPush(obj);

			var returnObj;

			var typeRouter = {
				"[object Array]":makeArrayInstructions,
				"[object Object]":makeObjectInstructions,
				"[object String]":makeStringInstructions,

				"[object Error]":makeErrorInstructions,
				"[object EvalError]":makeErrorInstructions,
				"[object RangeError]":makeErrorInstructions,
				"[object ReferenceError]":makeErrorInstructions,
				"[object SyntaxError]":makeErrorInstructions,
				"[object TypeError]":makeErrorInstructions,
				"[object URIError]":makeErrorInstructions
			};

			var objType = Object.prototype.toString.call(obj);

			if(typeRouter[objType])
				returnObj = typeRouter[objType](obj);

			else{

				var value,
					primObjConstructor = obj.constructor,
					flatObj = {},
					deepObj = {},
					key;

				if(
					objType === "[object Boolean]" ||
					objType === "[object Number]"
				)
					value = obj.valueOf();

				else if(objType === "[object Date]")
					value = obj.getTime();

				else
					value = obj;


				for(key in obj){

					if(
						typeof obj[key] === "object" &&
						obj[key] !== null &&
						!checkStack( obj[key] )
					)
						deepObj[key] = makeInstructions( obj[key] );

					else
						flatObj[key] = obj[key];
				}


				returnObj = {

					func:usePrimitiveObjectInstructions,

					primObjConstructor:primObjConstructor,

					value:value,

					flatObj:flatObj,

					deepObj:deepObj
				}
			}

			stackPop();

			return returnObj;
		}


		return obj;
	}

	function useInstructions(instructions){

		if(
			typeof instructions === "object"
			&& instructions !== null &&
			instructions.func
		)
			return instructions.func(instructions);

		return obj;
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
