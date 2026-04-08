// Extracted payload logic from original create-shipment.js
export const buildShipmentPayload = (formData: any, isTestEnvironment: boolean = true) => {
    const { shipper, receiver, shipMethod, shipDate, packages, payment, invoice, pickup } = formData;
    
    const isDocument = shipMethod === 'document';
    const isPackage = shipMethod === 'package';
    const isPickupRequested = pickup.required;
    const createInvoiceRequested = invoice.items.length > 0;
    const receiverPaysTaxes = payment.dutiesRole === 'receiver';
    const isDocUploadRequested = invoice.uploadDocuments;

    let payload: any = {};
    let valueAddedServices: any[] = [];

    const finalShipDate = isPickupRequested ? pickup.readyDate || shipDate : shipDate;
    payload.plannedShippingDateAndTime = `${finalShipDate}T09:00:00GMT+07:00`;

    payload.productCode = isDocument ? 'D' : 'P';

    payload.accounts = [];
    
    const shipperAccount = payment.shipperAccount;
    const useShipperForBilling = payment.paymentRole === 'shipper';
    const billingAccount = payment.billingAccount;

    payload.accounts.push({
        typeCode: "shipper",
        number: shipperAccount || "600000000"
    });

    payload.accounts.push({
        typeCode: "payer",
        number: useShipperForBilling ? (shipperAccount || "600000000") : billingAccount
    });

    if (isPackage && !receiverPaysTaxes && payment.dutiesAccount) {
        payload.accounts.push({
            typeCode: "duties-taxes",
            number: payment.dutiesAccount
        });
    }

    const constructAddressDetails = (data: any) => {
        const details: any = {
            postalAddress: {
                postalCode: data.postalCode,
                cityName: data.city,
                countryCode: data.country,
                addressLine1: data.address1,
                addressLine2: data.address2 || undefined,
                addressLine3: data.address3 || undefined,
            },
            contactInformation: {
                fullName: data.name,
                companyName: data.company || data.name,
                phone: data.phone,
                email: data.email || undefined,
            }
        };

        if (data.suburb) {
            details.postalAddress.countyName = data.suburb;
        }

        if (data.vat && data.country) {
            details.registrationNumbers = [
                {
                    typeCode: "VAT",
                    number: data.vat,
                    issuerCountryCode: data.country
                }
            ];
        }
        
        return details;
    };

    payload.customerDetails = {
        shipperDetails: constructAddressDetails(shipper),
        receiverDetails: constructAddressDetails(receiver)
    };
    
    payload.content = {
        packages: [], 
        unitOfMeasurement: "metric",
        isCustomsDeclarable: isPackage,
    };
    
    if (isDocument) {
        payload.content.description = formData.documentDescription || "Documents";
        payload.content.packages.push({
            weight: 0.5,
            dimensions: {
                length: 1,
                width: 38,
                height: 48
            }
        });
    }

    const isInsuranceRequested = formData.insurance && formData.insurance.required;
    const insuranceValue = formData.insurance && formData.insurance.value ? parseFloat(formData.insurance.value) : 0;
    const insuranceCurrency = invoice.currency || 'THB';

    if (isInsuranceRequested) {
        if (isDocument) {
            valueAddedServices.push({ serviceCode: "IB" });
        } else if (isPackage) {
            valueAddedServices.push({
                serviceCode: "II",
                value: insuranceValue,
                currency: insuranceCurrency
            });
        }
    }

    if (isPackage) {
        if (packages.length > 0 && packages[0].description) {
            payload.content.description = packages.length > 1 ? "Multiple Items" : packages[0].description;
        } else {
            payload.content.description = "Shipment details";
        }

        payload.content.incoterm = payment.incoterm || "DAP";
        
        // Calculate Declared Value
        if (isInsuranceRequested && insuranceValue > 0) {
            payload.content.declaredValue = insuranceValue;
            payload.content.declaredValueCurrency = insuranceCurrency;
        } else {
            let totalValue = invoice.items.reduce((sum: number, item: any) => sum + ((parseFloat(item.value) || 0) * (parseInt(item.quantity) || 0)), 0);
            let currency = invoice.currency || 'THB';
            
            payload.content.declaredValue = parseFloat(totalValue.toFixed(3));
            payload.content.declaredValueCurrency = currency;
        }

        payload.content.exportDeclaration = {
            lineItems: invoice.items.map((item: any, index: number) => {
                const lineItemObject: any = {
                    number: index + 1,
                    description: item.description || "Item",
                    price: parseFloat(item.value) || 0,
                    quantity: {
                        value: parseInt(item.quantity, 10) || 1,
                        unitOfMeasurement: item.units || "PCS",
                    },
                    exportReasonType: "permanent",
                    manufacturerCountry: item.origin || "TH",
                    weight: {
                        netValue: item.weight || 0.5,
                        grossValue: item.weight || 0.5,
                    },
                };

                if (item.commodityCode) {
                    lineItemObject.commodityCodes = [{
                        typeCode: "inbound",
                        value: item.commodityCode,
                    }];
                }

                return lineItemObject;
            }),
            invoice: {
                number: invoice.number || `INV-${Math.floor(Math.random()*10000)}`,
                date: shipDate,
            }
        };

        packages.forEach((pkg: any) => {
            const quantity = parseInt(pkg.quantity, 10) || 1;
            const packageData = {
                weight: parseFloat(pkg.weight) || 0.5,
                dimensions: {
                    length: parseFloat(pkg.length || pkg.depth) || 10,
                    width: parseFloat(pkg.width) || 10,
                    height: parseFloat(pkg.height) || 10,
                },
            };
            for (let i = 0; i < quantity; i++) {
                payload.content.packages.push(packageData);
            }
        });
    }

    const shipmentReference = formData.shipmentReference;
    if (shipmentReference) {
        payload.customerReferences = [{
            typeCode: "CU",
            value: shipmentReference
        }];
    }

    if (isDocUploadRequested) {
        valueAddedServices.push({ serviceCode: "WY" });
        // NOTE: Base64 logic moved to UI layer, which applies it directly to payload if WY is present
    }

    if (isPickupRequested) {
        const closeTimeRaw = pickup.closeTime || "17:00";
        payload.pickup = {
            isRequested: true,
            closeTime: closeTimeRaw,
            location: pickup.location || "Reception",
            specialInstructions: [{
                value: pickup.instructions || ""
            }],
            pickupDetails: {
                postalAddress: {
                    postalCode: pickup.postalCode || shipper.postalCode,
                    cityName: pickup.city || shipper.city,
                    countryCode: pickup.country || shipper.country, 
                    addressLine1: pickup.address1 || shipper.address1,
                    addressLine2: pickup.address2 || undefined,
                },
                contactInformation: {
                    phone: pickup.phone || shipper.phone,
                    companyName: pickup.company || shipper.company,
                    fullName: pickup.name || shipper.name,
                }
            }
        };
    } else {
        payload.pickup = { isRequested: false };
    }
    
    const isA4 = formData.printSize === 'A4';
    const labelTemplate = isA4 ? "ECOM26_84_A4_001" : "ECOM26_84_001";
    const waybillTemplate = isA4 ? "ARCH_8X4_A4_002" : "ARCH_8X4_001";

    payload.outputImageProperties = {
        encodingFormat: "pdf",
        imageOptions: [
            {
                typeCode: "label",
                templateName: labelTemplate,
                isRequested: true,
            },
			{
                typeCode: "waybillDoc",
                templateName: waybillTemplate,
                isRequested: true,
            },
            {
                typeCode: "shipmentReceipt",
                isRequested: true,
                templateName: "SHIPRCPT_EN_001",
            }
        ],
		splitInvoiceAndReceipt: true
    };

    if (isPackage && createInvoiceRequested) {
        payload.outputImageProperties.imageOptions.push({
            typeCode: "invoice",
            invoiceType: invoice.type || "commercial",
            isRequested: true,
        });
    }

    if (valueAddedServices.length > 0) {
        payload.valueAddedServices = valueAddedServices;
    }

    return payload;
};
