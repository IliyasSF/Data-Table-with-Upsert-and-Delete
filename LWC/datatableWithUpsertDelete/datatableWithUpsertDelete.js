import { LightningElement, track,api } from 'lwc';
import getColumns from '@salesforce/apex/DatatableWithUpsertDeleteController.getColumns';

const columns=[
    { "label" : "Name", "fieldName": "Name", "fieldType":"text", "isPicklist":false}, 
    { "label" : "Phone", "fieldName": "Phone", "fieldType":"text", "isPicklist":false},
    { "label" : "SLA Expiration Date", "fieldName": "SLAExpirationDate__c", "fieldType":"date", "isPicklist":false},    
    { "label" : "Account Number", "fieldName": "AccountNumber", "fieldType":"text", "isPicklist":false},    
    { "label" : "Account Source", "fieldName": "AccountSource", "fieldType":"picklist", "isPicklist":true,"fieldInfo":{"fieldApiName":"AccountSource","objectApiName":"Account"}}
];

// const columns=[
//     { "label" : "First Name", "fieldName": "FirstName", "fieldType":"text", "isPicklist":false}, 
//     { "label" : "Last Name", "fieldName": "LastName", "fieldType":"text", "isPicklist":false},
//     { "label" : "Birthdate", "fieldName": "Birthdate", "fieldType":"date", "isPicklist":false},      
//     { "label" : "Level", "fieldName": "Level__c", "fieldType":"picklist", "isPicklist":true,"fieldInfo":{"fieldApiName":"Level__c","objectApiName":"Contact"}}
// ];

export default class DatatableWithUpsertDelete extends LightningElement {   
   @track columns = [];
   showData = false;
   objectApiName = 'Account';
   objectLabel = 'Account';
//    objectApiName = 'Contact';
//    objectLabel = 'Contact';
   
    connectedCallback() 
    {                
        getColumns({ objectName : this.objectApiName, columnsString :JSON.stringify(columns)})
        .then(result => {
            if(result)
            {              
                console.log('result '+JSON.stringify(JSON.parse(result)));  
                this.columns = JSON.parse(result);       
                console.log('col '+this.columns);           
                this.showData = true;
                this.error = undefined;                
            }           
        })
        .catch(error => {
            this.message = undefined;
            this.error = error;
        });
    }    
}
