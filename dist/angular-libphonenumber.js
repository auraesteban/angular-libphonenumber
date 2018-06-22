/**
 * angular-libphonenumber
 * Nathan Hammond's libphonenumber ported to an angular filter
 * @version v1.1.0
 * @link https://github.com/cwill747/angular-libphonenumber
 * @license Apache-2.0
 */
(function (angular) {

/**
 * @ngdoc filter
 * @name phone-number
 * @kind function
 *
 * @description
 * filters a user typed phone number into a formatted number
 *
 */
/* global angular */
angular.module('cwill747.phonenumber', [])
  .directive('phoneNumber', ['$log', '$window', function($log, $window) {
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: {
        countryCode: '=',
        nonFormatted: '=?',
        extSymbol: '@'
      },
      controller: function() {
        this.countryCode = this.countryCode || 'us';
      },
      link: function(scope, element, attrs, ctrl) {
        var el = element[0];
        var ext = scope.extSymbol || 'x';
        scope.$watch('countryCode', function() {
          ctrl.$modelValue = ctrl.$viewValue + ' ';
        });

        function clearValue(value) {
          if (!value) {
            return value;
          }
          var expression = '([^0-9|+|' + ext + '])';
          var flags = 'g';
          var regExpression = new RegExp(expression, flags);
          return value.replace(regExpression, '');
        }

        function extractNumbers(value, ext) {
          var phoneParts = value.split(ext);
          return {
            phoneNumber: phoneParts[0] ? phoneParts[0] : '',
            extension: phoneParts[1]
          }
        }

        function applyPhoneMask(value, region, ext) {
          var phoneMask = value;
          try {
            var phoneNumber = extractNumbers(value, ext);
            var extension = typeof phoneNumber.extension === 'string' ? ' ' + ext + phoneNumber.extension : '';

            phoneMask = phoneUtils.formatAsTyped(phoneNumber.phoneNumber, region);
            phoneMask += extension;
          }
          catch (err) {
            $log.debug(err);
          }
          return phoneMask;
        }

        function clean(value) {
          var cleanValue = clearValue(value);
          scope.nonFormatted = cleanValue;
          var formattedValue = '';
          if (cleanValue && cleanValue.length > 1) {
            formattedValue = applyPhoneMask(cleanValue, scope.countryCode, ext);
          }
          else {
            formattedValue = cleanValue;
          }
          return formattedValue.trim();
        }

        function formatter(value) {
          if (ctrl.$isEmpty(value)) {
            return value;
          }
          return applyPhoneMask(clearValue(value), scope.countryCode, ext);
        }

        function parser(value) {
          if (ctrl.$isEmpty(value)) {
            scope.nonFormatted = '';
            return value;
          }

          var formattedValue = clean(value);
          if (formattedValue === value) {
            return value;
          }
          var start = el.selectionStart;
          var end = el.selectionEnd + formattedValue.length - value.length;

          if (value.length < formattedValue.length) {
            // shift the start by the difference
            start = start + (formattedValue.length - value.length);
          }
          if (value.length > formattedValue.length + 1) {
            start = start - (formattedValue.length - value.length);
          }
          // element.val(cleaned) does not behave with
          // repeated invalid elements
          ctrl.$setViewValue(formattedValue);
          ctrl.$render();

          el.setSelectionRange(start, end);
          //return cleaned;
          return clearValue(formattedValue);
        }

        function validator(value) {
          var isValidForRegion = false;
          try {
            isValidForRegion = $window.phoneUtils.isValidNumberForRegion(value, scope.countryCode);
          }
          catch (err) {
            $log.debug(err);
          }
          var valid = ctrl.$isEmpty(value) || isValidForRegion;
          ctrl.$setValidity('phoneNumber', valid);
          return value;
        }

        ctrl.$formatters.push(formatter);
        ctrl.$formatters.push(validator);
        ctrl.$parsers.push(parser);
        ctrl.$parsers.push(validator);
      }
    };

  }]);

})(angular);
