import React from 'react';
import { setJSExceptionHandler } from 'react-native-exception-handler';
import { Provider, connect } from 'react-redux';
import { AppRegistry, Text, View, NativeModules } from 'react-native';
import {
  Lbry,
  claimsReducer,
  contentReducer,
  fileReducer,
  fileInfoReducer,
  notificationsReducer,
  publishReducer,
  searchReducer,
  tagsReducer,
  walletReducer,
} from 'lbry-redux';
import {
  authReducer,
  blacklistReducer,
  costInfoReducer,
  filteredReducer,
  homepageReducer,
  rewardsReducer,
  subscriptionsReducer,
  syncReducer,
  userReducer,
} from 'lbryinc';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import AppWithNavigationState, {
  AppNavigator,
  navigatorReducer,
  reactNavigationMiddleware,
} from 'component/AppNavigator';
import { autoRehydrate, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-community/async-storage';
import FilesystemStorage from 'redux-persist-filesystem-storage';
import createCompressor from 'redux-persist-transform-compress';
import createFilter from 'redux-persist-transform-filter';
import moment from 'moment';
import drawerReducer from 'redux/reducers/drawer';
import settingsReducer from 'redux/reducers/settings';
import thunk from 'redux-thunk';

const globalExceptionHandler = (error, isFatal) => {
  if (error && NativeModules.Firebase) {
    NativeModules.Firebase.logException(isFatal, error.message ? error.message : 'No message', JSON.stringify(error));
  }
};
setJSExceptionHandler(globalExceptionHandler, true);

function isFunction(object) {
  return typeof object === 'function';
}

function isNotFunction(object) {
  return !isFunction(object);
}

function createBulkThunkMiddleware() {
  return ({ dispatch, getState }) => next => action => {
    if (action.type === 'BATCH_ACTIONS') {
      action.actions.filter(isFunction).map(actionFn => actionFn(dispatch, getState));
    }
    return next(action);
  };
}

function enableBatching(reducer) {
  return function batchingReducer(state, action) {
    switch (action.type) {
      case 'BATCH_ACTIONS':
        return action.actions.filter(isNotFunction).reduce(batchingReducer, state);
      default:
        return reducer(state, action);
    }
  };
}

const reducers = combineReducers({
  auth: authReducer,
  blacklist: blacklistReducer,
  claims: claimsReducer,
  content: contentReducer,
  costInfo: costInfoReducer,
  drawer: drawerReducer,
  file: fileReducer,
  fileInfo: fileInfoReducer,
  filtered: filteredReducer,
  homepage: homepageReducer,
  nav: navigatorReducer,
  notifications: notificationsReducer,
  publish: publishReducer,
  rewards: rewardsReducer,
  settings: settingsReducer,
  search: searchReducer,
  subscriptions: subscriptionsReducer,
  sync: syncReducer,
  tags: tagsReducer,
  user: userReducer,
  wallet: walletReducer,
});

const bulkThunk = createBulkThunkMiddleware();
const middleware = [thunk, bulkThunk, reactNavigationMiddleware];

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = compose;

const store = createStore(
  enableBatching(reducers),
  {}, // initial state,
  composeEnhancers(applyMiddleware(...middleware))
);
window.store = store;

const compressor = createCompressor();
const authFilter = createFilter('auth', ['authToken']);
/* const contentFilter = createFilter('content', ['positions']);
const saveClaimsFilter = createFilter('claims', ['byId', 'claimsByUri']);
const subscriptionsFilter = createFilter('subscriptions', ['enabledChannelNotifications', 'subscriptions']);
const settingsFilter = createFilter('settings', ['clientSettings']);
const tagsFilter = createFilter('tags', ['followedTags']);
const walletFilter = createFilter('wallet', ['receiveAddress']); */

const whitelist = ['auth', 'claims', 'content', 'subscriptions', 'settings', 'tags', 'wallet'];
/* store.subscribe(() => {
  const state = store.getState();
  const filteredState = Object.keys(state).filter(key => whitelist.includes(key)).reduce((o, k) => { o[k] = state[k]; return o; }, {});
  NativeModules.StatePersistor.update(filteredState);
}); */

// TODO: Find i18n module that is compatible with react-native
global.__ = str => str;

class LBRYApp extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <AppWithNavigationState />
      </Provider>
    );
  }
}

AppRegistry.registerComponent('LBRYApp', () => LBRYApp);

export default LBRYApp;
