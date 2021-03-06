/**
 *
 * User Interface for the Payment Subscription application
 *
 */
Ext.define('SampleApp.view.payment.Subscription', {
    extend: 'Ext.Container',
    xtype: 'att-payment-subscription',
    
    requires: [
        'Ext.form.Panel',
        'Ext.form.FieldSet',
        'SampleApp.view.Header',
        'SampleApp.view.Footer',
        'SampleApp.Config'
    ],
    
    config: {
        title: 'Subscription App',
        scrollable: 'vertical',
        defaults: {scrollable: null}
    },
    
    //override
    initialize: function() {
        this.add([
            {xtype: 'att-header'},
            this.buildCreateSubsciptionForm(),
            this.buildSubscriptionStatusForm(),
            this.buildSubscriptionDetails(),
            {xtype: 'att-footer'}
        ]);
    },
    
    /**
     * Builds the UI components for Feature 1: Create New Subscription.
     */
    buildCreateSubsciptionForm: function() {
        return {
            xtype   : 'formpanel',
            items   : [
                {
                    xtype    : 'fieldset',
                    title    : 'Create New Subscription',
                    defaults : {
                        xtype : 'radiofield',
                        labelWidth : '80%'
                    },
                    items   : [
                        {
                            name    : 'productPrice',
                            value   : 0.01,
                            checked : true,
                            label   : 'Subscribe for a penny'
                        },
                        {
                            name    : 'productPrice',
                            value   : 3.99,
                            label   : 'Subscribe for $3.99'
                        }
                    ]
                },
                {
                    xtype   : 'button',
                    ui      : 'action',
                    id      : 'btnSubscriptionCreate',
                    action  : 'createsubscription',
                    text    : 'Subscribe'
                }
            ]
        };
    },
   
    /**
     * Builds the UI components for Feature 2: Get Subscription Status.
     */
    buildSubscriptionStatusForm: function() {
        return {
            xtype   : 'formpanel',
            itemId  : 'subscriptionStatusForm',
            items   : [
                {
                    xtype    : 'fieldset',
                    title    : 'Get Subscription Status',

                   items:[{
                       xtype: 'fieldset',
                       defaults: {
                           labelWidth: '80%',
                       },
                       items: [{
                           xtype  : 'radiofield',
                           label  : 'Merchant Transaction ID',
                           name   : 'statusBy',
                           value  : 'MerchantTransactionId'
                       },{
                           xtype  : 'textfield',
                           name   : 'MerchantTransactionId',
                           readOnly : true
                           
                       }]
                   },{
                       xtype  : 'fieldset',
                       defaults: {
                           labelWidth: '80%',
                       },

                       items  : [ {
                           xtype  : 'radiofield',
                           label  : 'Auth Code',
                           name   : 'statusBy',
                           value  : 'SubscriptionAuthCode'
                       },{
                           xtype  : 'textfield',
                           name   : 'SubscriptionAuthCode',
                           readOnly : true
                       }]
                   },{
                       xtype  : 'fieldset',
                       defaults: {
                           labelWidth: '80%',
                       },

                       items  : [ {
                           xtype  : 'radiofield',
                           label  : 'Subscription ID',
                           name   : 'statusBy',
                           value  : 'SubscriptionId'
                       },{
                           xtype  : 'textfield',
                           name   : 'SubscriptionId',
                           readOnly : true
                       }]
                   }]
                },
                {
                    xtype   : 'button',
                    ui      : 'action',
                    id      : 'btnSubscriptionStatusGet',
                    action  : 'subscriptionstatus',
                    text    : 'Get Subscription Status'
                }
            ]
        };
    },
    
    /**
     * Builds the UI components for Feature 3: Get Subscription Details.
     */
    buildSubscriptionDetails: function() {
        var me = this;

        return {
            xtype   : 'formpanel',
            items   : [
                {
                    xtype    : 'fieldset',
                    title    : 'Get Subscription Details',
                    instructions : 'Select a Subscription from the list to see details or refund it',
                    defaults : {
                        labelWidth : '75%'
                    },
                    items : [
                        {
                            xtype        : 'dataview',
                            singleSelect : true,
                            scrollable   : null,
                            itemTpl      : me.buildSubscriptionDetailsTpl(),
                            store        : 'SubscriptionTransactions'
                        }
                    ]
                },
                {
                    xtype   : 'button',
                    ui      : 'action',
                    id      : 'btnSubscriptionDetailsGet',
                    action  : 'subscriptiondetails',
                    text    : 'Get Subscription Details'
                },{
                    xtype   : 'button',
                    ui      : 'action',
                    id      : 'btnSubscriptionCancel',
                    action  : 'cancelsubscription',
                    text    : 'Cancel Subscription'
                },{
                    xtype   : 'button',
                    ui      : 'action',
                    id      : 'btnSubscriptionRefund',
                    action  : 'refundsubscription',
                    text    : 'Refund Subscription'
                }
            ]
        };
    },
    
    /**
     * Builds the checkbox configuration to allow user to see the response from API call.
     */
    buildShowResponse: function() {
        return {
            xtype: 'fieldset',
            title: 'Options',
            items:[{
                xtype: 'checkboxfield',
                name: 'showresults',
                label: 'Show Server Response',
                labelWidth : '70%'
            }]  
        };
    },
    
    /**
     * Builds the Ext.XTemplate used by the Subscription Details List.
     */
    buildSubscriptionDetailsTpl: function() {
        return new Ext.XTemplate(
            '<div class="tx-row<tpl if="Selected == true"> sel</tpl>" onclick="globalPaymentController.selectTransaction(\'{MerchantTransactionId}\');">',
            '   <div>Subscription ID</div>',
            '   <div style="color:#666">{SubscriptionId}&nbsp;</div>',
            '   <div> Merchant Transaction ID</div>',
            '   <div style="color:#666">{MerchantTransactionId}</div>',
            '</div>'
        );
    }

});