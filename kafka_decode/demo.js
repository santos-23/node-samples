console.log('demo')
let i =1;

// setInterval(()=>{
//     console.log("count ",i)
//     i++
// },1000);

const originalFunction = function(...b) {
    console.log(this.name);
    console.log("Arguments:", b);
}
    
const boundFunction = originalFunction.bind({ name: "Alice" }, 1,3,4,5,6,7,8,9,0);
    
boundFunction(2);
// setInterval(()=>{
//     console.log("count ",i)
//     i++
// },1000);