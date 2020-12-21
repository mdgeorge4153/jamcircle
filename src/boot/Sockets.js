import VueSocketIOExt from 'vue-socket.io-extended';
import io from 'socket.io-client';
 
export default async ({ Vue }) => {
  const socket = io('http://localhost:8080');
  Vue.use(VueSocketIOExt, socket);
}

