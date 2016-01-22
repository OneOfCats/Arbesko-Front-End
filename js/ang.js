var app = angular.module('application', []);

app.controller('appController', ['$scope', 'dataExchange', '$window', '$timeout', 'focusInfo', function($scope, dataExchange, win, timeout, focusInfo){
  $scope.dataStorage = dataExchange.boundData();
  $scope.languagesList = dataExchange.boundLanguagesList();
  dataExchange.getAllData();
  $scope.globalActiveLanguage = 0;
  $scope.searchString = '';
  $scope.newLineName = ''; //Name of new line in input area
  $scope.focusOn = focusInfo; //Focusing on the last line

  $scope.changeLanguage = function changeLanguage(index){
    $scope.globalActiveLanguage = index;
  };

  $scope.addLine = function addLine(){
    for(var i = 0; i < $scope.dataStorage.length; i++){ //Check if this line already exists
      if($scope.dataStorage[i].msgid == $scope.newLineName){
        return;
      }
    }
    $scope.dataStorage.push(JSON.parse(JSON.stringify(dataExchange.itemExample))); //Creating a new line by line example
    $scope.dataStorage[$scope.dataStorage.length - 1].msgid = $scope.newLineName;
    $scope.newLineName = '';
    $scope.focusOn.doFocus = true;
  };

  $scope.sendAllData = function sendAllData(){
    dataExchange.sendAllData();
  };
}]);

app.factory('dataExchange', ['$http', function(http){
  var self = this;
  self.localesList = ['msgid'];
  self.receivedData = new Array();
  self.itemExample = {};

  self.getAllData = function getAllData(){
    getLocalesList().then(function(response){ //When got all locales, get translations for it
      getTranslations();
    });
  };
  
  self.boundData = function boundData(){
    return self.receivedData;
  }

  self.boundLanguagesList = function boundLanguagesList(){
    return self.localesList;
  };

  self.sendAllData = function sendAllData(){
    var arrayForSend = {};
    for(var i = 0; i < self.localesList.length; i++){
      if(self.localesList[i] == 'msgid') continue;
      arrayForSend[self.localesList[i]] = new Array();
    }
    for(var i = 0; i < self.receivedData.length; i++){
      var msgid = self.receivedData[i].msgid;
      for(var key in self.receivedData[i]){
        if(self.receivedData[i][key].length != 0 && key != 'msgid' && key != '$$hashKey'){
          arrayForSend[key].push({msgid: self.receivedData[i].msgid, msgstr: self.receivedData[i][key]});
        }
      }
    }
    console.log(arrayForSend);
  };

  function getLocalesList(){
    return http({method: 'GET', url: 'locales/locales.json'})
      .then(function(response){
        self.localesList.length = 1; //Reseting array and saving the first value (msgid)
        for(var i = 0; i < response.data['locales'].length; i++){ //Copy all data  one by one (to not to create a new reference of array)
          self.localesList.push(response.data['locales'][i]);
        }
        for(var i = 0; i < self.localesList.length; i++){ //Creating the example of empty translated item (for adding)
          self.itemExample[self.localesList[i]] = '';
        }
      });
  };

  function getTranslations(){
    for(var i = 0; i < self.localesList.length; i++){
      getFromLocale(self.localesList[i]);
    }

    function getFromLocale(locale){ //Get translations from this locale and add it to self.receivedData
      var httpData = http({method: 'GET', url: 'locales/' + locale + '.json'})
        .then(function(response){
          for(var i = 0; i < response.data.length; i++){
            var found = false;
            for(var j = 0; j < self.receivedData.length; j++){ //Search if this line for translation already exists
              if(self.receivedData[j].msgid === response.data[i].msgid){
                found = true;
                break;
              }
            }
            if(found){ //If this line exists - add new language
              self.receivedData[j][locale] = response.data[i].msgstr;
            }else{ //Or add new line
              var forPush = {};
              forPush['msgid'] = response.data[i].msgid;
              forPush[locale] = response.data[i].msgstr;
              self.receivedData.push(forPush);
            }
          }
        });
    }
  };

  return this;
}]);

app.factory('focusInfo', function(){ //Service for localeItem directive to exchange the focus information between it and controller
  var self = this;
  self.focusOn = {doFocus: false}; //When it's true, it means we just adeed a new line and want to focus it
  return self.focusOn;
});

app.directive('localeItem', ['$timeout', 'focusInfo', function(timeout, focusInfo){
  return{
    restrict: 'E',
    scope: {
      data: '=', //Data with translation
      active: '@', //Number of global active column
      ind: '@', //Index of the line 
      focused: '@', //Focusing enabled (after adding a new line)
    },
    templateUrl: 'directives/localeItem.html',
    link: function(scope, element, attrs){
      attrs.$observe();
      focusOn = focusInfo;

      timeout(function(){
        if(attrs.focused == 'true' && focusOn.doFocus){
          element.find('TEXTAREA')[0].focus();
          focusOn.doFocus = false;
        }
      });
    }
  };
}]);

app.filter('searchFilter', function(){
  return function(objects, searchString){
    if(!searchString || searchString.length == 0) return objects;
    var arrayOut = new Array();
    for(var i = 0; i < objects.length; i++){
      for(var key in objects[i]){
        if(objects[i][key].indexOf(searchString) != -1){
          arrayOut.push(objects[i]);
          break;
        }
      }
    }
    return arrayOut;
  };
});

angular.element(document).ready(function(){
  angular.bootstrap(document, ['application']);
});