import { LightningElement, api, track } from 'lwc';

export default class InputComponent extends LightningElement {
    @api record;
    @api field;
    @api fieldType;  
     
    @api fieldInfo;
    @api options;                
    
    @api upsertMode;
    @api isPicklist;

    value;
    label;
    
    connectedCallback() 
    {        
        this.value = this.record[this.field];
        this.label = this.field;        
    }    

    handleChange(event) 
    {
        this.value = event.target.value;         
        this.dispatchEvent(new CustomEvent('update',{ 
            detail:{ 
                val: this.value,
                uuid: this.record.uuid,
                field: this.field
            }
        }))        
    }   
}
