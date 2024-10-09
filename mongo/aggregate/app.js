
// app.js
const fetchDataBtn = document.getElementById('fetchDataBtn');
const postDataBtn = document.getElementById('postDataBtn');
const updateDataBtn = document.getElementById('updateDataBtn');
const deleteDataBtn = document.getElementById('deleteDataBtn');
const simultaneousDataBtn = document.getElementById('simultaneousDataBtn')

async function fetchData() {
    try {
        await axios.get('http://localhost:3000/api/getUser/')
            .then((res) =>{
                showOutput(res)
                console.log('Fetched data:', res.data);
            })
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function postData(){
    try{
        await axios.post('http://localhost:3000/api/createUser/',
        {
            stuname:"santos",
            age:21,
            city:"madurai",
            standard:12,
            mark1:86,
            mark2:80,
            mark3:77
        }).then((res) =>{
            showOutput(res);
            console.log("New datas are uploaded: ",res.data)
        });
    }catch(error){
        console.error('Error while uploading data:', error);
    }
}

async function updateData(){
    try{
        await axios.put('http://localhost:3000/api/updateUser/64ccea45e77a691501256953',
        {
            mark3:98
        }).then((res) =>{
            showOutput(res);
            console.log("datas are updated: ",res.data)
        });
    }catch(error){
        console.error('Error while updating data:', error);
    }
}

async function deleteData(){
    try{
        await axios.delete('http://localhost:3000/api/deleteUser/64c8d6afbe1bcfaac7723ddd')
        .then((res) =>{
            showOutput(res);
            console.log("datas are deleted: ",res.data);
        })
        
    }catch(error){
        console.error('Error while deleting data:', error);
    }
}

async function simultaneousData(){
    try{
        await axios.all([
            axios.get("http://localhost:3000/api/getUser/"),
            axios.get("http://localhost:3000/api/getOrder/"),
            axios.get('http://localhost:3000/api/getInventory/')
        ])
        .then((axios.spread((user,order,inventory) =>{
            showOutput(user);
            // showOutput(inventory)
            // showOutput(order)
        })))
        // .then((res)=>{
            // console.log(res[0]);
            // console.log(res[1]);
            // console.log(res[2]);
        // })
    }catch(error){
        console.log(error)
    }
}

  // INTERCEPTING REQUESTS & RESPONSES
axios.interceptors.request.use(
    config => {
        console.log(
            `${config.method.toUpperCase()} request sent to ${config.url} at ${new Date().getTime()}`
        )
        return config;
    }, error => {
        console.log(error)
    }
)

axios.interceptors.response.use(
    (response) => {
        console.log('Response data:', response.data);
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);





function showOutput(res){
    document.getElementById('result').innerHTML =
    `
    <br><br><hr>
    <div>Status: ${res.status}</div><hr>
    <div>Headers: </div>
    <div>
        <pre>${JSON.stringify(res.headers, null, 2)}</pre>
    </div><hr>
    <div>Data: </div>
    <div>
        <pre>${JSON.stringify(res.data, null, 2)}</pre>
    </div><hr>
    <div>Config: </div>
    <div>
        <pre>${JSON.stringify(res.config, null, 2)}</pre>
    </div><hr>
    `
}

fetchDataBtn.addEventListener('click', fetchData);
postDataBtn.addEventListener('click',postData);
updateDataBtn.addEventListener('click',updateData);
deleteDataBtn.addEventListener('click',deleteData);
simultaneousDataBtn.addEventListener('click',simultaneousData);