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



// OBJECT-TYPE SUPPORT FUNCTIONS
var makeInstructionsSupport = {

	"[object Object]":function(obj){
	
		var treatFlat = true;
		
		var conName = obj.constructor.name || 
			obj.constructor.toString().match(nameRE)[1];
		
		var isCustom = conName === "Object" 
			? false 
			: true;
		
		var cloneObj = new obj.constructor();
		
		
		if(isCustom)
			for(var cKey in cloneObj)
				if(cloneObj.hasOwnProperty(cKey))
					delete cloneObj[cKey];	
		
		
		for (var key in obj) {
			
			if( obj.hasOwnProperty(key) ){

				if(
					typeof obj[key] === 'object' &&
					obj[key] !== null &&
					!checkStack( obj[key] )
				){
					
					treatFlat = false;

					cloneObj[key] = makeInstructions( obj[key] );
				}

				else{

					cloneObj[key] = obj[key];
				}
			}
		}
		
		
		return {
			
			"instructionType": "[object Object]",
			
			"isCustom": isCustom,
			
			"treatFlat": treatFlat,
			
			"cloneObj": cloneObj
		};
	},


	"[object Array]":function(arr){
		
		var numKeys = false,
			numTreatFlat = true,
			numLength = arr.length,
			
			nonNumKeys = false,
			nonNumTreatFlat = true,
			
			parsed,
			isNumKey;
			
		var newArr = new arr.constructor( numLength ),
			newArrObj = {};
			
		
		for(var i in arr){
			
			parsed = parseFloat(i);
			
			isNumKey = parsed === Math.floor(parsed) && 
				isFinite(parsed);
			
			if(isNumKey){
				
				numKeys = true;
					
				if(
					typeof arr[i] === 'object' &&
					arr[i] !== null && 
					!checkStack(arr[i])
					
				){
					
					numTreatFlat = false;
					
					newArr[i] = makeInstructions( arr[i] );
				}
				
				else
					newArr[i] = arr[i];
			}
			
			else{
				
				nonNumKeys = true;
				
				if(
					arr[i] !== null && 
					typeof arr[i] === 'object' 
				){
					
					nonNumTreatFlat = false;
					
					newArrObj[i] = makeInstructions( arr[i] );
				}
				
				else
					newArrObj[i] = arr[i];
			}
			
			
		}
		
		return {
			
			instructionType: "[object Array]",
			
			numLength:numLength,
			numKeys:numKeys,
			numTreatFlat:numTreatFlat,
			
			nonNumKeys:nonNumKeys,
			nonNumTreatFlat:nonNumTreatFlat,
			
			newArr:newArr,
			newArrObj:newArrObj
		};
	},


	"[object Boolean]":function(obj){
		
		return makeInstructionsSupport.extras( 
			obj.valueOf(), 
			obj,
			obj.constructor
		);
	},

	"[object Date]":function(obj){
		
		return makeInstructionsSupport.extras( 
			obj.getTime(), 
			obj,
			obj.constructor
		); 
	},

	"[object Number]":function(obj){
		
		return makeInstructionsSupport.extras( 
			obj.valueOf(), 
			obj,
			obj.constructor
		);
	},

	"[object Regexp]":function(obj){
		
		return makeInstructionsSupport.extras( 
			obj, 
			obj,
			obj.constructor,
		); 
	},

	"[object String]":function(obj){
		
		var value = obj.valueOf(),
			stringLength = obj.length;

		var hasExtras = false, 
			extraObj = {};
			
		var parsed,
			isNumKey;

		
		for(var key in obj){

			parsed = parseFloat(key);

			isNumKey = parsed === Math.floor(parsed) && 
				isFinite(parsed);

			if(!isNumKey || parsed >= stringLength){
				
				hasExtras = true;
				
				extraObj[key] = obj[key];
			}
		}
		
		return {
			
			"instructionType":"primitiveObject",
			
			"primitiveConstructor":obj.constructor,
			
			"value":value,
			
			"hasExtras":hasExtras,
			
			"extraObj":extraObj
			
		};
			
	},


	"Error":function(err){
		
		var newErr;

		var hasExtras = false, 
			extraObj = {};
			
		
		if(err.stack){ // not ES3; but in FireFox2
			
			newErr = new err.constructor(err.message);
			
			newErr.stack = err.stack;
		}
		
		else
			newErr = new err.constructor(err.message + " INACCURATE OR MISSING STACK-TRACE");

		
		for(var key in err){

			hasExtras = true;
				
			extraObj[key] = err[key];

		}
		
		return {
			
			"instructionType":"Error",
			
			"newErr":newErr,
			
			"hasExtras":hasExtras,
			
			"extraObj":extraObj
			
		};
	},


	"extras":function( value, obj, instructionType ){
		
		var hasExtras = false;
		
		var extraObj = {};
		
		var extrasPrim = true;
		
		
		for (var key in obj) {
			
			hasExtras = true;
			
			if(
				obj[key] !== null && 
				typeof obj[key] === 'object' &&
				!checkStack(obj[key])
			){
				
				extrasPrim = false;
				
				extraObj[key] = makeInstructions( obj[key] );
			}

			else
				extraObj[key] = obj[key];
		}
		
		
		return {
			
			"instructionType":"primitiveObject",
			
			"primitiveConstructor":obj.constructor,
			
			"value":value,
			
			"hasExtras":hasExtras,
			
			"extraObj":extraObj,
		};
	}

};

// MAIN FUNCTION
function makeInstructions(obj){

	if(
		typeof obj === "object" && 
		obj!== null &&
		!checkStack(obj)
	){
		
		var it = Object.prototype.toString.call(obj);
		
		stackPush(obj);

		var newObj = makeInstructionsSupport[it] 
			? makeInstructionsSupport[it](obj) 
			: makeInstructionsSupport["Error"];
		
		stackPop();

		return newObj;
	}
	
	return obj;
}


// OBJECT-TYPE SUPPORT FUNCTIONS
var useInstructionsSupport = {
	
	"[object Object]":function(instructions){
		
		var cloneObj = new instructions.cloneObj.constructor();
		
		if(instructions.isCustom){
			
			for(var cKey in cloneObj)
				delete cloneObj[cKey];
			
			if(instructions.treatFlat)
				for(var key in instructions.cloneObj)
					if( instructions.cloneObj.hasOwnProperty(key) )
						cloneObj[key] = instructions.cloneObj[key];
					
			else 
				for(var key in instructions.cloneObj){
					
					if( instructions.cloneObj.hasOwnProperty(key) ){
						
						if(
							typeof instructions.cloneObj[key] === "object" &&
							instructions.cloneObj[key] !== null
						)
							cloneObj[key] = useInstructions(instructions.cloneObj[key]);
						
						else
							cloneObj[key] = instructions.cloneObj[key];
					}
				}
		}
	
		else{
			
			if(instructions.treatFlat)
				for(var key in instructions.cloneObj)
					cloneObj[key] = instructions.cloneObj[key];
					
			else 
				for(var key in instructions.cloneObj){
					
					if(
						typeof instructions.cloneObj[key] === "object" &&
						instructions.cloneObj[key] !== null
					)
						cloneObj[key] = useInstructions(instructions.cloneObj[key]);
						
					else
						cloneObj[key] = instructions.cloneObj[key];
				}
		}
		
		
		return cloneObj;
	},
	
	
	"[object Array]":function(instructions){
		
		var newArr = new instructions.newArr.constructor(instructions.numLength);
		
		if(instructions.numKeys){
			
			if(instructions.numTreatFlat)
				newArr = instructions.newArr.slice();
			
			else
				for(var i in instructions.newArr){
					
					if(
						typeof instructions.newArr[i] === "object" &&
						instructions.newArr[i] !== null
					)
						newArr[i] = useInstructions( instructions.newArr[i] );
					
					else
						newArr[i] = instructions.newArr[i];
						
				}
		}
		
		if(instructions.nonNumKeys){
			
			if(instructions.nonNumTreatFlat)
				for(var key in instructions.newArrObj)
					newArr[key] = instructions.newArrObj[key];
					
			
			else
				for(var key in instructions.newArrObj){
					
					if(
						typeof instructions.newArrObj[key] === "object" &&
						instructions.newArrObj[key] !== null
					)
						newArr[key] = useInstructions( instructions.newArrObj[key] );
					
					else
						newArr[key] = instructions.newArrObj[key];
						
				}
		}
		
		
		return newArr;
	},
	
	
	"primitiveObject":function(instructions){
		
		var newPrimitiveObject = new instructions.primitiveConstructor(instructions.value);
		
		if(instructions.hasExtras){
			
			for(var key in instructions.extraObj){

				newPrimitiveObject[key] = instructions.extraObj[key];
			}
		}
		
		return newPrimitiveObject;
	},
	
	
	"Error":function(instructions){
		
		var newErr;
		
		if(instructions.newErr.stack){ // not ES3; but in FireFox2
			
			newErr = new instructions.newErr.constructor(err.message);
			
			newErr.stack = instructions.newErr.stack;
		}
		
		else
			newErr = new instructions.newErr.constructor(err.message + " INACCURATE OR MISSING STACK-TRACE");

		
		if(instructions.hasExtras){
			
			for(var key in instructions.extraObj){
					
				newErr[key] = instructions.extraObj[key];

			}
		}
		
		return newErr;
	}
};

// MAIN FUNCTION
function useInstructions(heavyInstructions){
	
	if(
		typeof heavyInstructions === "object" && 
		heavyInstructions["instructionType"]
	)
		return useInstructionsSupport[ heavyInstructions["instructionType"] ](heavyInstructions);

	return heavyInstructions;
}
