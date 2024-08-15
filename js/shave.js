var app = angular.module("app", []);

app.controller("ShaveController", ['$scope', '$rootScope', '$timeout', '$http', function ($scope, $rootScope, $timeout, $http) {
    const ctrl = this;
    window.ctrl = this;
    ctrl.tal = "taltest";
    ctrl.recommendations = {} 
    ctrl.age_sex_to_data_mapping = {};
    ctrl.medical_advice_dict = {};
    ctrl.well_being_pairs_dict = {};
    ctrl.age = getParameterByName("age");
    ctrl.sex = getParameterByName("sex");
    ctrl.isWelcomePage = true;
    ctrl.medicalCaseIds = "";
    ctrl.wellbeingCaseIds = "";

    function init() {
        $http.get('data/age_sex_to_data_mapping.json').then(function (response) {
            ctrl.age_sex_to_data_mapping = response.data;
        });
        $http.get('data/medical_advice_recommendations.json').then(function (response) {
            ctrl.medical_advice_dict =  Object.fromEntries(response.data.map(item => [item.id, item]));
        });
        $http.get('data/well_being_recommendations.json').then(function (response) {
            ctrl.well_being_pairs_dict =  Object.fromEntries(response.data.map(item => [item.id, item]));
        });
    };

    init();

    ctrl.calculateRecommendations = function() {
        if (!!!ctrl.sex || !!!ctrl.age) {
            return;
        }
        ctrl.isWelcomePage = false;
        updateQueryParameter("age", ctrl.age);
        updateQueryParameter("sex", ctrl.sex);
        const key = `${ctrl.age},${ctrl.sex=='male' ? 'True': 'False'}`;
        ctrl.medicalCaseIds = ctrl.age_sex_to_data_mapping[key]?.medical_case;        
        ctrl.wellbeingCaseIds = ctrl.age_sex_to_data_mapping[key]?.wellbeing_case;        
    };

    ctrl.personalizedMedicalRecommendations = function() {
        return ctrl.medicalCaseIds.map(key => ctrl.medical_advice_dict[key]);
    }

    ctrl.personalizedWellbeingRecommendations = function() {
        return ctrl.wellbeingCaseIds.map(key => ctrl.well_being_pairs_dict[key]);
    }

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