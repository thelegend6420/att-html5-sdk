/**
 * Controller that interacts with the Subscription application.
 */
Ext.define('SampleApp.controller.payment.Subscription', {
    extend: 'Ext.app.Controller',
   
    requires: [
       'Att.Provider',
       'Att.ApiResults',
       'SampleApp.Config',
       'Ext.MessageBox'
    ],

    config: {
        provider: undefined,

        refs: {
            view: 'att-payment-subscription',
            responseView: {
                xtype: 'apiresults',
                selector: 'apiresults',
                hidden: true,
                autoCreate: true
            },
            transactionList: 'att-payment-subscription dataview'
        },
        
        control: {
            'att-payment-subscription button[action=createsubscription]': {
                'tap': 'onCreateSubscription'
            },
            'att-payment-subscription button[action=subscriptionstatus]': {
                'tap': 'onSubscriptionStatus'
            },
            'att-payment-subscription button[action=subscriptiondetails]':{
                'tap': 'onSubscriptionDetails'
            },
            'att-payment-subscription button[action=refundsubscription]': {
                'tap': 'onRefundSubscription'
            },
            'att-payment-subscription button[action=cancelsubscription]': {
                'tap': 'onCancelSubscription'
            },
            'actionsheet button[action=close]': {
                'tap': 'onCloseResponseView'
            }
        }
    },
    
    /**
     * Gets called internally when provider property is set during config initialization.
     * We'll initialize here our Att.Provider instance to perform the API calls. 
     * @param provider the value we set in config option for this property.
     * @returns
     */   
    applyProvider: function(provider) {
        if (!provider) {
            provider = Ext.create('Att.Provider',{
                apiBasePath: SampleApp.Config.apiBasePath
            });
        }

        return provider;

    },
    
    launch: function() {
        globalPaymentController = this;
        var selectedSubscription = this.getTransactionList().getStore().findRecord("Selected", true);
        if (selectedSubscription) {
            var subscriptionStatusForm = this.getView().down('#subscriptionStatusForm');
            subscriptionStatusForm.setValues({
                MerchantTransactionId: selectedSubscription.get('MerchantTransactionId'),
                SubscriptionAuthCode: selectedSubscription.get('SubscriptionAuthCode'),
                SubscriptionId: selectedSubscription.get('SubscriptionId')
            });
        }
    },
    
    showResponseView: function(success, response){
        var responseView =  this.getResponseView();
       
        Ext.Viewport.add(responseView);
       
        responseView.setData({
            success: success,
            results: JSON.stringify(response, null, '\t')
        });
       
        responseView.show();    
    },
    
    onCloseResponseView: function(){
        this.getResponseView().hide();
    },
    
    /**
     * Creates a subscription payment by calling requestPaidSubscription
     */
    onCreateSubscription: function(btn, event, eOpts) {
        var me = this,
            view = me.getView(),
            provider = me.getProvider(),
            list = me.getTransactionList(),
            subscriptionStatusForm = view.down('#subscriptionStatusForm'),
            form = btn.up('formpanel').getValues(),
            paymentOptions;
        
        list.deselectAll();
        
        view.setMasked(true);
        
        subscriptionStatusForm.reset();
        
        paymentOptions = me.buildPaymentOptions(form);
        
        provider.requestPaidSubscription({
            paymentOptions: paymentOptions,
            success: function(response){
                view.setMasked(false);
                var store = list.getStore();
                var records = store.add({
                    MerchantTransactionId: paymentOptions.merch_trans_id,
                    MerchantSubscriptionId: paymentOptions.merch_sub_id_list,
                    SubscriptionAuthCode: response.TransactionAuthCode
                });
                store.sync();
                me.fillFieldsWithSelectedTransaction(paymentOptions.merch_trans_id, records[0]);
                me.showResponseView(true, response);
            },
            failure: function(error){
                view.setMasked(false);
                me.showResponseView(false, error);
            }
        });
    },
   
    //private
    buildPaymentOptions: function(form) {
        var tx = new Date().getTime();
        return {
            "amount":form.productPrice,
            "category":1,
            "desc":"Word subscription 1",
            "merch_trans_id":"User" + tx + "Transaction",
            "merch_prod_id":"wordSubscription1",
            "merch_sub_id_list": ("List" + tx).substring(0, 11),
            "sub_recurrences":99999,
            "redirect_uri": window.location.origin + "/att/payment"
        };
    },

    /**
     * Handler for subscription status button. Calls updateSubscriptionStatus with the merchatTransactionId obtained when the subscription was created.
     */
    onSubscriptionStatus: function(btn, event, eOpts) {
        var me = this,
            cfg = SampleApp.Config,
            form = btn.up('formpanel'),
            statusBy = form.getValues().statusBy,
            value;
        
        if(!statusBy) {
            Ext.Msg.alert(cfg.alertTitle, 'Please select a value to use to obtain subscription status');
            return;
        }
        
        value = form.down('textfield[name='+statusBy+']').getValue();

        if(!value) {
            Ext.Msg.alert(cfg.alertTitle, 'Please select a value to use to obtain subscription status');
            return;
        }        
        
        me.updateSubscriptionStatus(statusBy, value);
        
    },
    
    /**
     * Retrieve Subscription status
     * @param type {String} the type of ID used to get status
     * @param value {String} the value used to retrieve the status
     */
    updateSubscriptionStatus: function(type, value) {
        var me = this,
            view = me.getView(),
            provider = me.getProvider();
            store = me.getTransactionList().getStore(),
            transaction = store.findRecord(type, value),
            subscriptionStatusForm = view.down('#subscriptionStatusForm');

        
        view.setMasked(true);
        
        AttApiClient.Payment.getSubscriptionStatus(
            {type: type, id: value},
            function(response){
                var sid = response.SubscriptionId;
                
                view.setMasked(false);
                me.showResponseView(true, response);
                

                if(sid){  //Make sure we have a success response before update record and form values.
                    
                    subscriptionStatusForm.down('textfield[name=SubscriptionId]').setValue(sid);
                    if(!transaction){
                        //In case user checks status of another subscription we need to create a
                        //new record since it wasn't generated previously.
                        transaction = Ext.create(store.getModel().getName(), {
                            MerchantTransactionId: response.MerchantTransactionId,
                        });
                        store.add(transaction);
                    }
                    //update record
                    transaction.set('SubscriptionId', sid);
                    transaction.set('MerchantTransactionId',response.MerchantTransactionId);
                    transaction.set('MerchantSubscriptionId',response.MerchantSubscriptionId);
                    transaction.set('ConsumerId',response.ConsumerId);
                    store.sync();
                }
            
            },
            function(error){
                view.setMasked(false);
                me.showResponseView(false, error);
            }
        );
    },
    
    /**
     * Gets the Subscription details by pulling merchantTransactionId and consumerId inputs fields values previously obtained by getting status.
     */
    onSubscriptionDetails: function(btn, event, eOpts) {
        var me = this,
            view = me.getView(),
            provider = me.getProvider(),
            list = me.getTransactionList(),
            cfg = SampleApp.Config,
            subscription;

        subscription = list.getStore().findRecord("Selected", true);
        if(!subscription) {
            Ext.Msg.alert(cfg.alertTitle, 'Select a subscription from list');
            return;
        }
        
        if (!subscription.get("ConsumerId")) {
            Ext.Msg.alert(cfg.alertTitle, 'ConsumerId required - please get subscription status first');
            return;
        }
        
        view.setMasked(true);

        AttApiClient.Payment.getSubscriptionDetail(
            {
                merchantSubscriptionId: subscription.get("MerchantSubscriptionId"),
                consumerId: subscription.get("ConsumerId")
            },
            function(response){
                view.setMasked(false);
                me.showResponseView(true, JSON.stringify(response));
            },
            function(error){
                view.setMasked(false);
                me.showResponseView(false, error);
            }
        );
    },
    
    /**
     * Refunds a Subscription using the subscriptionId
     */
    onRefundSubscription: function(btn, event, eOpts) {
        var me = this,
            view = me.getView(),
            list = me.getTransactionList(),
            store = list.getStore(),
            cfg = SampleApp.Config,
            subscriptionStatusForm = view.down('#subscriptionStatusForm'),
            subscription;
        
        var subscription = store.findRecord('Selected', true);
        if(!subscription) {
            Ext.Msg.alert(cfg.alertTitle, 'Select a subscription from list');
            return;
        }
        
        if(!subscription.get('SubscriptionId')){
            Ext.Msg.alert(cfg.alertTitle, 'Subscription Id is needed to refund. Please first get Subscription Status');
            return;
        }
        
        view.setMasked(true);

        AttApiClient.Payment.refundTransaction(
            {
                transactionId: subscription.get('SubscriptionId'),
                reasonId: 1,
                reasonText: "Customer was not happy"
            },
            function success(response){
                view.setMasked(false);
                me.showResponseView(true, response);
                
                if(response.IsSuccess && response.IsSuccess !== "false"){ 
                    subscriptionStatusForm.reset();
                    store.remove(subscription);
                    store.sync();
                }
            },
            function failure(error){
                if (error.status == 400) { // the transaction probably doesn't exist
                    subscriptionStatusForm.reset();
                    store.remove(subscription);
                    store.sync();
                }
                view.setMasked(false);
                me.showResponseView(false, error);
            }
        );
    },

    /**
     * Cancel a Subscription using the subscriptionId
     */
    onCancelSubscription: function(btn, event, eOpts) {
        var me = this,
            view = me.getView(),
            list = me.getTransactionList(),
            store = list.getStore(),
            cfg = SampleApp.Config,
            subscriptionStatusForm = view.down('#subscriptionStatusForm'),
            subscription;

        var subscription = store.findRecord('Selected', true);
        if(!subscription) {
            Ext.Msg.alert(cfg.alertTitle, 'Select a subscription from list');
            return;
        }

        if(!subscription.get('SubscriptionId')){
            Ext.Msg.alert(cfg.alertTitle, 'Subscription Id is needed to cancel. Please first get Subscription Status');
            return;
        }

        view.setMasked(true);

        AttApiClient.Payment.cancelSubscription(
            {
                transactionId: subscription.get('SubscriptionId'),
                reasonId: 1,
                reasonText: "Customer was not happy"
            },
            function success(response){
                view.setMasked(false);
                me.showResponseView(true, response);
                
                if(response.IsSuccess && response.IsSuccess !== "false"){ 
                    subscriptionStatusForm.reset();
                    store.remove(subscription);
                    store.sync();
                }
            },
            function failure(error){
                if (error.status == 400) { // the transaction probably doesn't exist
                    subscriptionStatusForm.reset();
                    store.remove(subscription);
                    store.sync();
                }
                view.setMasked(false);
                me.showResponseView(false, error);
            }
        );
    },
    
    // called from raw template code for the transaction list
    selectTransaction: function(merchantTransactionId) {
        var store = this.getTransactionList().getStore();
        var previouslySelectedRecord = store.findRecord("Selected", true);
        if (previouslySelectedRecord) {
            previouslySelectedRecord.set("Selected", false);
        }
        var newlySelectedRecord = store.findRecord("MerchantTransactionId", merchantTransactionId).set("Selected", true);
//        list.refresh();
        this.fillFieldsWithSelectedTransaction(merchantTransactionId, newlySelectedRecord);
    },
    
    fillFieldsWithSelectedTransaction: function(merchantTransactionId, record) {
        record = record || this.getTransactionList().getStore().findRecord("Selected", true);
        if (record) {
            var subscriptionStatusForm = this.getView().down('#subscriptionStatusForm');
            subscriptionStatusForm.setValues({
                MerchantTransactionId: merchantTransactionId,
                SubscriptionAuthCode: record.get('SubscriptionAuthCode'),
                SubscriptionId: record.get('SubscriptionId')
            });
        }
    }
});
