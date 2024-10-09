

function fun(){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            console.log(123)
            resolve(10)
        },2000)
    })
}

// async...await
async function fun1() { 
    try {
        console.log("Before function execution")
        let val = await fun() // take 2 seconds to execute fun1 will wait untill fun executes
        console.log(val)
        console.log("After function execution")
    } catch (error) {
        console.log(error)
    }
}

// then()...catch()
async function fun2() {
    try {
        console.log("Before function execution")
        await fun().then((res)=>{
                console.log(res)
            })
            .catch((e)=>{
                console.log(e)
            })
        console.log("After function execution")
    } catch (error) {
        console.log(error)
    }
}

fun2()