const constructor = jest.fn();
const onopen = jest.fn();
const onclose = jest.fn();
const onmessage = jest.fn();
const send = jest.fn();

// Define WebSocket globally to be able to check on mocked functions
class WebSocket {
  constructor () { constructor() };
  onopen () { onopen() };
  onclose () { onclose() };
  onmessage () { onmessage() };
  send (message) { send(message) };
}
global.WebSocket = WebSocket;

const WebSocketRouter = require('../web-socket-router');
const webSocketRouterInstance = new WebSocketRouter('ws://localhost:8080');

test('Should execute the constructor once', () => {
  expect(constructor.mock.calls.length).toBe(1);
});

test('Should have the action-constant fields defined', () => {
  expect(webSocketRouterInstance.action).toEqual({
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      CREATE: 'CREATE',
      SUBSCRIBE: 'SUBSCRIBE',
      REQUEST: 'REQUEST'
  });
});

test('Should events arrays be empty', () => {
  expect(webSocketRouterInstance.events.length).toBe(0);
  expect(webSocketRouterInstance.lastEvents.length).toBe(0);
  expect(webSocketRouterInstance.registeredTasks.length).toBe(0);
});

test('Should send object data', () => {
  const data = {
    dataa: 'a',
    datab: true,
    datac: 123,
    datad: [],
    datae: {
      datainner: [123, 2, 'asd', false]
    }
  };

  webSocketRouterInstance.send(data);
  expect(send.mock.calls.length).toBe(1);
  expect(send.mock.calls[0][0]).toBe(JSON.stringify(data));
});

test('Should send empty object data', () => {
  const data = {};
  webSocketRouterInstance.send(data);
  expect(send.mock.calls.length).toBe(2);
  expect(send.mock.calls[1][0]).toBe(JSON.stringify(data));
});

test('Should send error message', () => {
  const error = "Error Message";
  webSocketRouterInstance.error(error);
  expect(send.mock.calls.length).toBe(3);
  expect(send.mock.calls[2][0]).toBe(JSON.stringify(
    {"route":"/socket/error","data":"Error Message"}
  ));
});

test('Should routify all the URLs', () => {
  expect(webSocketRouterInstance.routify('*').exec('verylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstring')).toBeTruthy();
  expect(webSocketRouterInstance.routify('*/id').exec('person/id')).toBeTruthy();
  expect(webSocketRouterInstance.routify('*/ids/*').exec('person/ids/asd')).toBeTruthy();
  expect(webSocketRouterInstance.routify('user/id').exec('user/id')).toBeTruthy();
  expect(webSocketRouterInstance.routify('/*').exec('/verylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstring')).toBeTruthy();
  expect(webSocketRouterInstance.routify('/*/id').exec('/person/id')).toBeTruthy();
  expect(webSocketRouterInstance.routify('/*/ids/*').exec('/person/ids/asd')).toBeTruthy();
  expect(webSocketRouterInstance.routify('/user/id').exec('/user/id')).toBeTruthy();
  expect(webSocketRouterInstance.routify('*/a').exec('verylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstring')).toBeFalsy();
  expect(webSocketRouterInstance.routify('/id').exec('person/id')).toBeFalsy();
  expect(webSocketRouterInstance.routify('/*/a').exec('person/ids/asd')).toBeFalsy();
  expect(webSocketRouterInstance.routify('/*/asd/*/id').exec('user/id')).toBeFalsy();
  expect(webSocketRouterInstance.routify('/*/asdasd').exec('/verylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstringverylongstring')).toBeFalsy();
  expect(webSocketRouterInstance.routify('/*/id/*').exec('/person/id')).toBeFalsy();
  expect(webSocketRouterInstance.routify('/*/ids/*/sss').exec('/person/ids/asd')).toBeFalsy();
  expect(webSocketRouterInstance.routify('*/*/*/asd').exec('/user/id')).toBeFalsy();
});

test('Should run all the callbacks with the provided data', () => {
  const callbacks = [
      jest.fn(), jest.fn(), jest.fn()
  ]

  const data = {
    dataa: 'a',
    datab: true,
    datac: 123,
    datad: [],
    datae: {
      datainner: [123, 2, 'asd', false]
    }
  }

  webSocketRouterInstance.runner(callbacks, data);

  for (let cb of callbacks) {
    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0]).toBe(data);
  }

});

test('Should throw error executing the task and dispatch a message', () => {
  const error = new Error("Error");
  const callbacks = [
      () => {
          throw(error)
      }
  ]

  webSocketRouterInstance.runner(callbacks, {});

  expect(send.mock.calls.length).toBe(4);
  expect(JSON.parse(send.mock.calls[3][0]).route).toBe("/socket/error");
});

test('Should attach an on handler with no overload.', () => {
  webSocketRouterInstance.on('/custom/route', () => {});
});
