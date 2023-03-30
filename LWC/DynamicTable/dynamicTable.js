import { LightningElement, track, api,wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRecords from '@salesforce/apex/DatatableWithUpsertDeleteController.getRecords';
import deleteReocrds from '@salesforce/apex/DatatableWithUpsertDeleteController.deleteReocrds';
import upsertRecords from '@salesforce/apex/DatatableWithUpsertDeleteController.upsertRecords';

export default class DynamicTable extends LightningElement 
{    
    @api objectApiName;
    @api objectLabel;
    @api columnList;   
    @api recordSize;

    currentPage =1;   
    totalPage = 0;
       
    @track columns;
    @track rows = [];
    @track bufferData = [];
    @track selectedRows = [];
    @track visibleRecords = [];
    uuidToRecordMap = new Map();
    uuidToSelectedRowsMap = new Map();

    showData = false;
    viewMode = true;
    editMode = false;
    insertMode = false;
    deleteMode = false; 
    upsertMode = false;    
    
    fields = '';    

    page = '';

    connectedCallback() 
    {
        let cleanedColumnList = this.columnList[0] === '\\' ? this.columnList.substring(1) : this.columnList;
        if(cleanedColumnList)
        {
            this.columns = cleanedColumnList;

            for(var index=0; index<this.columns.length; index++)
            {
                if(index==0)
                {
                    this.fields = this.columns[index].fieldName;
                }
                else
                {
                    this.fields += ', '+this.columns[index].fieldName;
                }                                             
            }                    
            this.loadRecords();
        }        
    }

    loadRecords() 
    {
        getRecords
        ({
            objectApiName: this.objectApiName,            
            fields:this.fields
        })
            .then(result => {
                this.rows = [];
                this.visibleRecords = [];
                this.uuidToRecordMap.clear();
                this.uuidToSelectedRowsMap.clear();
                this.bufferData = [];

                //to hide the data
                this.manageDataHiding();
        

                for(var index=0;index<result.length;index++)
                {
                    var obj = {};            
                    obj = JSON.parse(JSON.stringify(result[index]));

                    obj.uuid = this.createUUID();
                    obj.isChecked = false;            
                    this.rows.push(obj);
                    
                    this.uuidToRecordMap.set(obj.uuid, obj);                    
                }               

                if(this.rows)
                {
                    this.bufferData = JSON.parse(JSON.stringify(this.rows));
                    if(this.rows){    
                        this.currentPage = 1;                     
                        this.recordSize = Number(this.recordSize);
                        this.totalPage = Math.ceil(this.rows.length/this.recordSize);
                        if(this.totalPage > 1)
                        {
                            this.page = 'Pages';
                        }
                        else
                        {
                            this.page = 'Page';
                        }
                        this.updateRecords();
                    }
                    this.showData = true;
                    this.setMode(true, false, false, false, false);
                }
                               
            })
            .catch(error => {
                this.error = error;
            });
    }

    createUUID() 
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
    }

    manageDataHiding()
    {
        this.showData = false;
        this.setMode(false, false, false, false, false);        
    }

    handleModes(event)
    {
        if(event.target.value == "editMode")
        {
            this.setMode(false, true, false, false, true);            
        }
        else if(event.target.value == "insertMode")
        {
            var tempId = this.createUUID();
            this.visibleRecords = [];
            this.uuidToRecordMap.clear();
    
            this.visibleRecords = [{ uuid: tempId, isChecked: false}];
            this.uuidToRecordMap.set(tempId, this.visibleRecords[0]);  

            this.setMode(false, false, true, false, true);            
        }
        else if(event.target.value == "deleteMode")
        {
            this.setMode(false, false, false, true, false);            
        }
    }    

    setMode(viewMode, editMode, insertMode, deleteMode, upsertMode)
    {
        this.viewMode = viewMode;
        this.editMode = editMode;
        this.insertMode = insertMode;
        this.deleteMode = deleteMode;
        this.upsertMode = upsertMode;
    }

    handleEditCancel()
    {      
        this.loadRecords();        
    }

    handleInsertAndDeleteCancel()
    {                      
        this.rows = [];
        this.visibleRecords = [];
        this.uuidToRecordMap.clear();
        this.uuidToSelectedRowsMap.clear();
        this.currentPage = 1;        
        this.rows = JSON.parse(JSON.stringify(this.bufferData));
        for(var index=0;index<this.rows.length;index++)
        {                       
            this.uuidToRecordMap.set(this.rows[index].uuid, this.rows[index]);            
        }
        this.updateRecords();
        this.setMode(true, false, false, false, false);
        
    }
    
    handleSave(event) 
    {      
       if(this.insertMode)
       {
            this.rows = this.visibleRecords;
       }

        
        upsertRecords
        ({ 
            records : JSON.stringify(this.rows),
            objectApiName: this.objectApiName             
        })
        .then(result => {
            this.message = result;
            this.error = undefined;                
                        
            if(this.message !== undefined) {
                this.showToastEvent('Success', 'Records saved successfully!', 'success');                
                this.loadRecords();
            }                
        })
        .catch(error => {
            this.message = undefined;
            this.error = error;
                    
            this.showToastEvent('Error', 'Error while creating records', 'error');            
        });
    }

    handleDelete()
    {
        if(this.uuidToSelectedRowsMap.size>0)
        {
            var selectedRows = [];
            
            this.manageDataHiding();
            for (let record of this.uuidToSelectedRowsMap.values()) 
            {
                selectedRows.push(record);
            }
            
            deleteReocrds({ recordList: selectedRows  })
            .then(result => {        
                this.showToastEvent('Success', 'Records deleted successfully!', 'success');                        
                this.loadRecords();
            })
            .catch(error => {                        
            });
        }
        else
        {
            this.showToastEvent('Error', 'Please select atleast 1 record to perform delete operation.', 'error');            
        }
    }

    getSelectedRecords(event) 
    {       
        var uuid=event.target.dataset.id;
        this.uuidToRecordMap.get(uuid).isChecked = event.target.checked;

        if(event.target.checked)
        {    
            this.uuidToSelectedRowsMap.set(uuid, this.uuidToRecordMap.get(uuid));    
        }
        else
        {
            this.uuidToSelectedRowsMap.delete(uuid);
        }

    }

    removeRow(event) {
        if(this.visibleRecords.length > 1)
        {
            this.uuidToRecordMap.delete(this.visibleRecords[event.target.value].uuid);
            this.visibleRecords.splice(event.target.value, 1);
        }
        else
        {
            this.showToastEvent('Error', 'Can not delete all the rows.', 'error');            
        }
                
    }
    
    addRow() {  
        var tempId = this.createUUID();
        
        this.visibleRecords.push({ uuid: tempId, isChecked: false});
        this.uuidToRecordMap.set(tempId, this.visibleRecords[this.visibleRecords.length-1]);       
                
    }        

    get disablePrevious(){ 
        return this.currentPage<=1
    }
    get disableNext(){ 
        return this.currentPage>=this.totalPage
    }
    previousHandler(){ 
        if(this.currentPage>1){
            this.currentPage = this.currentPage-1
            this.updateRecords()
        }
    }
    nextHandler(){
        if(this.currentPage < this.totalPage){
            this.currentPage = this.currentPage+1
            this.updateRecords()
        }
    }
    updateRecords(){ 
        const start = (this.currentPage-1)*this.recordSize
        const end = this.recordSize*this.currentPage
        this.visibleRecords = this.rows.slice(start, end)        
    }

    updateVal(event){        

        this.uuidToRecordMap.get(event.detail.uuid)[event.detail.field] = event.detail.val;

    }

    showToastEvent(title, message, variant)
    {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            }),
        );
    }
}
