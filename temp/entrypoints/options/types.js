"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudProvider = void 0;
// Cloud Role System Types
var CloudProvider;
(function (CloudProvider) {
    CloudProvider["AWS_CN"] = "aws-cn";
    CloudProvider["AWS_GLOBAL"] = "aws-global";
    CloudProvider["AZURE"] = "azure";
    CloudProvider["GCP"] = "gcp";
    CloudProvider["CUSTOM"] = "custom";
})(CloudProvider || (exports.CloudProvider = CloudProvider = {}));
