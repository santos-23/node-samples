const getDataBtn = document.getElementById('get');
const sendDataBtn = document.getElementById('send')

async function getData(){
    try {
        const response = await axios.get('api/data');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function sendData(){
    const dataToSend = {
        message : 'hello from client'
    }
    try {
        const response = await axios.post('http://loaclhost:3000/api/data');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

getDataBtn.addEventListener('click',getData);
sendDataBtn.addEventListener('click',sendData);