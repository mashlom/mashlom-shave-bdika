var app = angular.module("app", []);

app.controller("ResusController", ['$scope', '$rootScope', '$timeout', '$http', function ($scope, $rootScope, $timeout, $http) {
    const ctrl = this;
    window.ctrl = this;
    ctrl.tal = "taltest";
    ctrl.recommendations = {} 
    ctrl.age_sex_to_data_mapping = {};
    ctrl.medical_advice_pairs = {};
    ctrl.well_being_pairs = {};
    ctrl.age = "";
    ctrl.sex = "";

    function init() {
        $http.get('/data/recommendations.json').then(function (response) {
            ctrl.recommendations = response.data;
        });

        $http.get('/data/age_sex_to_data_mapping.json').then(function (response) {
            ctrl.age_sex_to_data_mapping = response.data;
        });
        $http.get('/data/medical_advice_pairs.json').then(function (response) {
            ctrl.medical_advice_pairs = response.data;
        });
        $http.get('/data/well_being_pairs.json').then(function (response) {
            ctrl.well_being_pairs = response.data;
        });
    };

    init();

    ctrl.init = function () {
        init();
    }

    ctrl.personalizedRecommendations = function() {
        const key = `${ctrl.age},${ctrl.sex=='M' ? 'True': 'False'}`;
        const medicalCaseIds = ctrl.age_sex_to_data_mapping[key]?.medical_case;
        return ctrl.medical_advice_pairs.filter(caseItem => medicalCaseIds.includes(caseItem.id));
    }


    ctrl.personalizedWellbeing = function() {
        const key = `${ctrl.age},${ctrl.sex=='M' ? 'True': 'False'}`;
        const medicalCaseIds = ctrl.age_sex_to_data_mapping[key]?.medical_case;
        return ctrl.well_being_pairs.filter(caseItem => medicalCaseIds.includes(caseItem.id));
    }

    ctrl.setSex = function(value) {
        ctrl.sex = value;
    };
}]);


app.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModelCtrl) {
            var prevValue = '';
            element.on('click', function () {
                if (!$window.getSelection().toString()) {
                    this.setSelectionRange(0, this.value.length);
                }
            });
            element.on('input', function () {
                if (this.checkValidity()) {
                    prevValue = this.value;
                } else {
                    this.value = prevValue;
                    ngModelCtrl.$setViewValue(this.value);
                    ngModelCtrl.$render();
                }
            });
        }
    };
}]);