import { Middleware } from '@reduxjs/toolkit';

const logger: Middleware = store => next => action => {
  console.group(`%cAction: ${action.type}`, 'color: #4CAF50; font-weight: bold;');
  console.log('%cPrevious State:', 'color: #9E9E9E; font-weight: bold;', store.getState());
  console.log('%cAction:', 'color: #2196F3; font-weight: bold;', action);
  
  const result = next(action);
  
  console.log('%cNext State:', 'color: #4CAF50; font-weight: bold;', store.getState());
  console.groupEnd();
  
  return result;
};

export default logger; 