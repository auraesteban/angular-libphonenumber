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

        function clearValue (value) {
          if (!value) {
            return value;
          }
          var expression = '([^0-9+' + ext + '])';
          var flags = 'g';
          var regex = new RegExp(expression, flags);
          return value.replace(regex, '');
        }

        function extractNumbers (value) {
          var regex = new RegExp(ext, 'g');
          var cleanValue = clearValue(value).replace(regex, ''); // without extensions
          var isE164 = cleanValue.match(/^(\+1|1)/g, '');
          var phoneNumber = value;
          var phoneNumberLength = isE164 && isE164.length ? (10 + isE164[0].length) : 10;

          var extension = '';
          if (cleanValue.length >= 10) {
            phoneNumber = cleanValue.substr(0, phoneNumberLength);
            extension = cleanValue.substr(phoneNumberLength).replace(/[\D]/g, '');
          }

          return {
            phoneNumber: phoneNumber,
            extension: extension
          };
        }

        function applyPhoneMask (value, region) {
          var phoneMask = value;
          try {
            var output = extractNumbers(value);
            phoneMask = phoneUtils.formatAsTyped(output.phoneNumber, region);

            if (output.extension) {
              phoneMask += ' ' + ext + output.extension;
            }
          }
          catch (err) {
            $log.debug(err);
          }
          return phoneMask;
        }

        function clean (value) {
          var cleanValue = clearValue(value);
          scope.nonFormatted = cleanValue;
          var formattedValue = '';
          if (cleanValue && cleanValue.length > 1) {
            formattedValue = applyPhoneMask(cleanValue, scope.countryCode);
          }
          else {
            formattedValue = cleanValue;
          }
          return formattedValue.trim();
        }

        function formatter (value) {
          if (ctrl.$isEmpty(value)) {
            return value;
          }
          return applyPhoneMask(clearValue(value), scope.countryCode);
        }

        function parser (value) {
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

        function validator (value) {
          var isValidForRegion = false;
          try {
            var output = extractNumbers(value);
            isValidForRegion = $window.phoneUtils.isValidNumberForRegion(output.phoneNumber, scope.countryCode);
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
