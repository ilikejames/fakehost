/* tslint:disable */
/* eslint-disable */
/**
 * OpenAPI definition
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface KeyValue
 */
export interface KeyValue {
    /**
     * 
     * @type {string}
     * @memberof KeyValue
     */
    key?: string;
    /**
     * 
     * @type {string}
     * @memberof KeyValue
     */
    value?: string;
}

/**
 * Check if a given object implements the KeyValue interface.
 */
export function instanceOfKeyValue(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function KeyValueFromJSON(json: any): KeyValue {
    return KeyValueFromJSONTyped(json, false);
}

export function KeyValueFromJSONTyped(json: any, ignoreDiscriminator: boolean): KeyValue {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'key': !exists(json, 'key') ? undefined : json['key'],
        'value': !exists(json, 'value') ? undefined : json['value'],
    };
}

export function KeyValueToJSON(value?: KeyValue | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'key': value.key,
        'value': value.value,
    };
}

