import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  User, MapPin, Package, CreditCard,
  FileText, Truck, ClipboardList,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, Trash2,
  AlertCircle, CheckCircle2, Check, Info, Upload, Clock, List, Globe
} from 'lucide-react';

import countriesData from '../../data/countries.json';
import incotermsData from '../../data/incoterms.json';
import appConfig from '../../data/appConfig.json';
import currenciesData from '../../data/currencies.json';
import documentTypes from '../../data/documentTypes.json';
import uomData from '../../data/uom.json';
import { buildShipmentPayload } from '../utils/createShipment';


// --- Utils ---
const transformCountryData = (apiResponse: any) => {
  if (!apiResponse || !apiResponse.referenceData || !apiResponse.referenceData[0] || !apiResponse.referenceData[0].data) {
    console.error("Invalid country data structure from API");
    return [];
  }
  const countryDataArray = apiResponse.referenceData[0].data;
  return countryDataArray.map((countryDetails: any) => {
    const countryObject: any = {};
    countryDetails.forEach((attributePair: any) => {
      countryObject[attributePair.attribute] = attributePair.value;
    });
    return countryObject;
  }).sort((a: any, b: any) => a.countryName.localeCompare(b.countryName));
};

// --- Sub Components ---
// --- Sub Components ---
const AddressCard = ({ title, data, onChange, countries, bgClass = '', readOnlyCountry = false, showError = false, requiredEmail = true, showCountryPlaceholder = true }: { title: string, data: any, onChange: (d: any) => void, countries: any[], bgClass?: string, readOnlyCountry?: boolean, showError?: boolean, requiredEmail?: boolean, showCountryPlaceholder?: boolean }) => {
  const { t } = useLanguage();

  // Logic to manage receiver address fields (City vs Postal Code vs Suburb)
  // In legacy, many receiver fields were hidden until a country was selected. 
  // We'll show/hide fields based on the selected country's postalLocationTypeCode.
  const selectedCountry = countries.find(c => c.countryCode === data.country);
  const mode = selectedCountry?.postalLocationTypeCode || 'CP'; // Default to City/Postal

  // CP: City/Postal, C: City only, S: City/Suburb
  // Suburb is only for receiver but we let 'mode' control it if present in data
  const showPostal = mode === 'CP';
  const showSuburb = mode === 'S' && 'suburb' in data;

  const countryError = showError && !data.country;

  return (
    <div className={`card space-y-6 ${bgClass} transition-shadow hover:shadow-2xl`}>
      <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 dark:border-gray-800 pb-4">
        <User className="w-6 h-6" />
        <h3 className="text-xl font-bold uppercase tracking-tight">{title}</h3>
      </div>

      <div className="space-y-4">
        <Input label={t('name' as any)} value={data.name} onChange={(v: any) => onChange({ ...data, name: v })} required ruleKey="name" showError={showError} />
        <Input label={t('company' as any)} value={data.company} onChange={(v: any) => onChange({ ...data, company: v })} required ruleKey="company" showError={showError} />
      </div>

      <div className="space-y-1.5 focus-within:z-10">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('country' as any)}</label>
        <div className="relative">
          <select
            className={`w-full p-4 pr-12 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold disabled:opacity-50 transition-all ${readOnlyCountry ? 'bg-gray-50 border-none pointer-events-none' : 'hover:border-gray-200'} ${countryError ? 'border-dhl-red ring-4 ring-red-500/10' : 'border-gray-50 dark:border-gray-700'}`}
            value={data.country}
            onChange={e => onChange({ ...data, country: e.target.value })}
            disabled={readOnlyCountry}
          >
            {showCountryPlaceholder && <option value="" disabled>{t('typeOrSelectCountry' as any)}</option>}
            {countries.map((c: any, index: number) => <option key={`${c.countryCode}-${index}`} value={c.countryCode}>{c.countryName || c.name}</option>)}
          </select>
          {!data.country && (
            <span className="absolute right-10 top-1/2 -translate-y-1/2 text-dhl-red font-black text-xl animate-pulse pointer-events-none">*</span>
          )}
          {!!data.country && (
            <Check className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5 animate-in zoom-in pointer-events-none" strokeWidth={3} />
          )}
        </div>
        {countryError && (
          <p className="text-[10px] font-bold text-dhl-red ml-1">Country is required</p>
        )}
      </div>

      {data.country && (
        <div className="space-y-6 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-4">
            <Input label={t('address1' as any)} value={data.address1} onChange={(v: any) => onChange({ ...data, address1: v })} required ruleKey="address1" showError={showError} />
            <Input label={t('address2' as any)} value={data.address2} onChange={(v: any) => onChange({ ...data, address2: v })} ruleKey="address2" showError={showError} />
            <Input label={t('address3' as any)} value={data.address3} onChange={(v: any) => onChange({ ...data, address3: v })} ruleKey="address3" showError={showError} />
          </div>

          <div className={`grid grid-cols-1 ${(showPostal || showSuburb) ? 'md:grid-cols-2' : ''} gap-4`}>
            {showPostal && (
              <Input label={t('postalCode' as any)} value={data.postalCode} onChange={(v: any) => onChange({ ...data, postalCode: v })} required ruleKey="postalcode" showError={showError} />
            )}
            {showSuburb && (
              <Input label={t('suburb' as any)} value={data.suburb} onChange={(v: any) => onChange({ ...data, suburb: v })} required ruleKey="suburb" showError={showError} />
            )}
            <Input label={t('city' as any)} value={data.city} onChange={(v: any) => onChange({ ...data, city: v })} required ruleKey="city" showError={showError} />
          </div>

          <div className="space-y-4">
            <Input label={t('email' as any)} value={data.email} onChange={(v: any) => onChange({ ...data, email: v })} required={requiredEmail} ruleKey="email" showError={showError} />
            <Input label={t('phone' as any)} value={data.phone} onChange={(v: any) => onChange({ ...data, phone: v })} required ruleKey="phone" showError={showError} />
          </div>

          <Input label={t('vat' as any)} value={data.vat} onChange={(v: any) => onChange({ ...data, vat: v })} ruleKey="vat" showError={showError} />

          {'suburb' in data && data.country === 'MX' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-500 mt-0.5" />
              <p className="text-xs font-bold text-yellow-800">{t('mexicoTaxIdRequired' as any)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', required, disabled, readOnly, ruleKey, showError, min, max, placeholder, inputMode, pattern }: { label: string, value: any, onChange?: (v: any) => void, type?: string, required?: boolean, disabled?: boolean, readOnly?: boolean, ruleKey?: string, showError?: boolean, min?: string, max?: string, placeholder?: string, inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search", pattern?: string }) => {
  const { t } = useLanguage();
  const rule = ruleKey ? (appConfig.validationRules as any)[ruleKey] : null;
  const maxLength = rule?.maxLength;
  const currentLength = value?.toString().length || 0;

  const isAtLimit = maxLength && currentLength >= maxLength;
  const isMissingValue = required && (!value || value.toString().trim() === '');

  // Specific Format Validations
  const isEmail = ruleKey === 'email';
  const isPhone = ruleKey === 'phone';

  const isEmailInvalid = isEmail && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhoneTooShort = isPhone && value && value.toString().length < 4;

  // A 'hard error' is something that prevents proceeding (missing or invalid format)
  const isHardError = showError && (isMissingValue || isEmailInvalid || isPhoneTooShort);

  const handleTextChange = (v: string) => {
    if (type === 'date' || type === 'number') {
      onChange?.(v);
      return;
    }
    let sanitized = v;

    if (isPhone) {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    } else if (ruleKey === 'accountNumber') {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    } else {
      sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
    }

    onChange?.(sanitized);
  };

  return (
    <div className="space-y-1.5 flex-grow">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => handleTextChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          min={min}
          max={max}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
          className={`w-full p-4 pr-12 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-200'} ${readOnly ? 'bg-gray-50 dark:bg-gray-900 border-none' : ''} ${isHardError ? 'border-dhl-red ring-4 ring-red-500/10' : 'border-gray-50 dark:border-gray-700'}`}
        />
        {required && !value && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dhl-red font-black text-xl animate-pulse pointer-events-none">*</span>
        )}
        {required && !!value && !isEmailInvalid && !isPhoneTooShort && (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5 animate-in zoom-in pointer-events-none" strokeWidth={3} />
        )}
      </div>
      {/* Red Limit Message shows ONLY during typing, hidden after validation if field is OK */}
      {isAtLimit && !showError && (
        <p className="text-[10px] font-bold text-dhl-red ml-1 animate-in fade-in slide-in-from-top-1">Maximum {maxLength} characters</p>
      )}
      {showError && isMissingValue && (
        <p className="text-[10px] font-bold text-dhl-red ml-1 animate-in fade-in slide-in-from-top-1">This field is required</p>
      )}
      {showError && (isEmailInvalid || isPhoneTooShort) && !isMissingValue && (
        <p className="text-[10px] font-bold text-dhl-red ml-1 animate-in fade-in slide-in-from-top-1">
          {isEmailInvalid ? t('emailInvalid' as any) : 'Phone must be at least 4 digits'}
        </p>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color, active }: any) => (
  <div className={`p-6 rounded-3xl border-2 transition-all ${active ? 'bg-red-50 dark:bg-red-950/20 border-dhl-red shadow-lg shadow-red-500/10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
  </div>
);

const SummarySection = ({ title, icon: Icon, children }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon className="w-4 h-4" />
      <h4 className="text-[10px] font-bold uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const SummaryField = ({ label, value }: any) => (
  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-2">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-gray-900 dark:text-white italic">{value}</span>
  </div>
);

// Inject Official Custom DHL Icons to match exact "look and feel" requested
const DhlIcon = ({ name, className }: { name: string; className?: string }) => {
  const paths: Record<string, string> = {
    document: "M28,4H8V44H40V16H28ZM13,14h9v2H13ZM35,34H13V32H35Zm0-11v2H13V23Zm5-9H30V4Z",
    parcel: "M23,14H6l6-8H23ZM36,6H25v8H42ZM6,16H42V42H6ZM30,38h8V31H30Z"
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={`fill-current ${className}`}>
      <path d={paths[name] || paths.parcel} />
    </svg>
  );
};

interface ShipPageProps {
  onFinish: (response: any) => void;
  onBack: () => void;
}

export const ShipPage: React.FC<ShipPageProps> = ({ onFinish, onBack }) => {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({ 0: true });

  // Validation rules from appConfig
  const packageQuantityMin = appConfig.validationRules.package.quantity.min;
  const packageQuantityMax = appConfig.validationRules.package.quantity.max;
  const packageWeightMin = appConfig.validationRules.package.weight.min;
  const packageWeightMax = appConfig.validationRules.package.weight.max;
  const packageDimensionsMin = appConfig.validationRules.package.dimensions.min;
  const packageDimensionsMax = appConfig.validationRules.package.dimensions.max;

  const lineItemQuantityMin = appConfig.validationRules.lineItem.quantity.min;
  const lineItemWeightMin = appConfig.validationRules.lineItem.weight.min;
  const lineItemValueMin = appConfig.validationRules.lineItem.value.min;

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Addresses
    shipper: { name: '', company: '', address1: '', address2: '', address3: '', city: '', postalCode: '', phone: '', email: '', country: 'TH', vat: '' },
    receiver: { name: '', company: '', address1: '', address2: '', address3: '', city: '', postalCode: '', phone: '', email: '', country: '', vat: '', suburb: '' },

    // Step 2: Shipment Method & Details
    shipMethod: 'package' as 'package' | 'document',
    shipDate: new Date().toISOString().split('T')[0],
    documentDescription: 'Documents - general business',
    shipmentReference: '',
    summarizeShipment: '',
    insurance: { required: false, value: '' },
    lineItems: [{ description: '', quantity: 1, weight: 0.5, value: 1, origin: 'TH', units: 'PCS', commodityCode: '' }],

    // Step 3: Packaging
    packages: [{ quantity: 1, weight: 0.5, width: 10, height: 10, depth: 10 }],

    // Step 4: Payment
    payment: {
      shipperAccount: '',
      billingAccount: '',
      dutiesAccount: '',
      incoterm: 'DAP',
      paymentRole: 'shipper',
      dutiesRole: 'shipper'
    },

    // Step 5: Customs Docs (Invoice items & docs)
    invoice: {
      creationMode: 'own' as 'create' | 'own',
      type: 'commercial' as 'commercial' | 'proforma',
      number: '',
      currency: 'THB',
      items: [{ description: '', quantity: 1, weight: 0.5, value: 1, origin: 'TH', units: 'PCS', commodityCode: '' }],
      uploadedDocs: [] as File[],
    },

    // Step 6: Pickup
    pickup: {
      required: true,
      location: 'Reception',
      instructions: '',
      readyTime: '09:00',
      closeTime: '17:00'
    }
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://sbs-back-test.vercel.app/api/address-reference?datasetName=country');
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();
        const transformed = transformCountryData(data);

        // Apply VN override logic from legacy appConfig.json if needed
        // "overrideConditions": { "VN": "S" }
        const finalized = transformed.map((c: any) => {
          if (c.countryCode === 'VN') return { ...c, postalLocationTypeCode: 'S' };
          return c;
        }).filter((c: any, index: number, arr: any[]) => arr.findIndex((c2: any) => c2.countryCode === c.countryCode) === index);

        setCountries(finalized);
        setFormData(prev => ({ ...prev, receiver: { ...prev.receiver, country: finalized[0]?.countryCode || '' } }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching live country data, falling back to local:", error);
        if (countriesData && countriesData.length > 0) {
          const uniqueCountries = countriesData.filter((c: any, index: number, arr: any[]) => arr.findIndex((c2: any) => c2.code === c.code) === index);
          setCountries(uniqueCountries);
          setFormData(prev => ({ ...prev, receiver: { ...prev.receiver, country: uniqueCountries[0]?.code || '' } }));
        }
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const steps = [
    { id: 1, name: 'addressStep', icon: MapPin },
    { id: 2, name: 'shipmentDetailsStep', icon: List },
    { id: 3, name: 'packageStep', icon: Package },
    { id: 4, name: 'paymentStep', icon: CreditCard },
    { id: 5, name: 'docsStep', icon: FileText },
    { id: 6, name: 'pickupStep', icon: Truck },
    { id: 7, name: 'summaryStep', icon: CheckCircle2 },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      // Basic validation for Step 1 mandatory fields
      const { shipper, receiver } = formData;
      
      // Email format validation function
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      
      // Shipper validation: email is required and must be valid format
      const isShipperValid = shipper.name && shipper.company && shipper.address1 && shipper.city && shipper.phone && shipper.email && isValidEmail(shipper.email);
      
      // Receiver validation: email is optional but if provided must be valid format
      const isReceiverValid = receiver.name && receiver.company && receiver.country && receiver.address1 && receiver.city && receiver.phone && (!receiver.email || isValidEmail(receiver.email));

      if (!isShipperValid || !isReceiverValid) {
        setShowValidationErrors(true);
        // Optional: toast or scroll to first error
        return;
      }
    }

    if (currentStep === 2) {
      // Validation for Step 2 mandatory fields
      if (formData.shipMethod === 'document') {
        if (!formData.shipDate || !formData.documentDescription.trim()) {
          setShowValidationErrors(true);
          return;
        }
      } else {
        // Block package shipments
        setShowValidationErrors(true);
        return;
      }
    }

    if (currentStep === 4) {
      // Validation for Step 4 mandatory fields
      const { payment } = formData;
      if (!payment.shipperAccount || !payment.billingAccount || (payment.dutiesRole !== 'receiver' && !payment.dutiesAccount) || !payment.incoterm) {
        setShowValidationErrors(true);
        return;
      }
    }

    if (currentStep < 7) {
      setShowValidationErrors(false);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleFinalSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    } else {
      onBack();
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    // Original Logic Implementation: Validate and build exact payload. 
    try {
      const payload = buildShipmentPayload(formData, true);
      console.log("DEBUG: Final Payload:", JSON.stringify(payload, null, 2));

      // Mocking API call response based on the new rigorous payload
      setTimeout(() => {
        const mockResponse = {
          shipmentTrackingNumber: 'WAYBILL' + Math.floor(Math.random() * 1000000000),
          dispatchConfirmationNumber: 'PRG' + Math.floor(Math.random() * 1000000),
          warnings: ['Successfully tested local data and advanced API payload mapping!'],
          documents: [
            { typeCode: 'waybilldoc', content: 'JVBERi0xLjQKJ...' },
            { typeCode: 'invoice', content: 'JVBERi0xLjQKJ...' }
          ],
          payloadReconstructed: payload
        };
        setIsSubmitting(false);
        onFinish(mockResponse);
      }, 1200);
    } catch (e) {
      console.error("Error building payload:", e);
      setIsSubmitting(false);
    }
  };

  const updateSection = (section: string, data: any) => {
    setFormData(prev => ({ ...prev, [section]: { ...(prev as any)[section], ...data } }));
  };

  // Step 3 Package Logic
  const addPackage = () => {
    const newIndex = formData.packages.length;
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, { quantity: 1, weight: 0.5, width: 10, height: 10, depth: 10 }]
    }));
  };

  const removePackage = (index: number) => {
    if (formData.packages.length > 1) {
      setFormData(prev => ({
        ...prev,
        packages: prev.packages.filter((_, i) => i !== index)
      }));
    }
  };

  // Step 5 Invoice Logic
  const [itemDescError, setItemDescError] = useState(false);
  const addInvoiceItem = () => {
    // Rule: can't add if last item description is blank (only flag that field)
    const lastItem = formData.invoice.items[formData.invoice.items.length - 1];
    if (!lastItem.description || lastItem.description.trim() === '') {
      setItemDescError(true);
      return;
    }
    setItemDescError(false);
    const newIndex = formData.invoice.items.length;
    setFormData(prev => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        items: [...prev.invoice.items, { description: '', quantity: 1, weight: 0.1, value: 1, origin: 'TH', units: 'PCS', commodityCode: '' }]
      }
    }));
    // Collapse previous items, expand new one
    const collapsed: Record<number, boolean> = {};
    formData.invoice.items.forEach((_, idx) => { collapsed[idx] = false; });
    collapsed[newIndex] = true;
    setExpandedItems(collapsed);
  };

  const removeInvoiceItem = (index: number) => {
    if (formData.invoice.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        invoice: {
          ...prev.invoice,
          items: prev.invoice.items.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const totalPackageWeight = formData.packages.reduce((sum, p) => sum + (p.weight * p.quantity), 0);
  const totalInvoiceValue = formData.invoice.items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
  const totalInvoiceWeight = formData.invoice.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
          {t('createShipment')}
        </h1>
        <div className="px-4 py-1 bg-dhl-yellow rounded-full text-[10px] font-bold uppercase tracking-widest text-dhl-red">
          {language === 'th' ? 'โหมดทดสอบ' : 'Test Mode'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl flex items-center justify-between overflow-x-auto gap-4 custom-scrollbar lg:mx-0 -mx-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isDisabled = (step.id === 5 && formData.shipMethod === 'document');

          return (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-2 min-w-fit px-4 transition-all ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-dhl-red text-white scale-110 shadow-lg shadow-red-500/30' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-dhl-red' : 'text-gray-400'}`}>
                  {t(step.name as any)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block h-[2px] flex-grow min-w-[20px] ${isCompleted ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Steps Content */}
      <div className="min-h-[400px]">
        {/* STEP 1: ADDRESSES */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
            <AddressCard
              title={t('shipperInfo' as any)}
              data={formData.shipper}
              onChange={d => updateSection('shipper', d)}
              countries={countries}
              readOnlyCountry
              showError={showValidationErrors}
            />
            <AddressCard
              title={t('receiverInfo' as any)}
              data={formData.receiver}
              onChange={d => updateSection('receiver', d)}
              countries={countries}
              bgClass="bg-yellow-50/30"
              showError={showValidationErrors}
              requiredEmail={false}
              showCountryPlaceholder={false}
            />
          </div>
        )}

        {/* STEP 2: METHOD */}
        {currentStep === 2 && (
          <div className="card space-y-12 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 pb-4">
              <List className="w-6 h-6" />
              <h3 className="text-xl font-bold uppercase tracking-tight">{t('shipmentDetailsStep')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => setFormData(p => ({ ...p, shipMethod: 'document' }))}
                className={`group flex flex-col items-center p-10 rounded-3xl border-2 transition-all ${formData.shipMethod === 'document' ? 'border-dhl-red bg-red-50 text-dhl-red' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-dhl-yellow'}`}
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${formData.shipMethod === 'document' ? 'bg-dhl-red text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <DhlIcon name="document" className="w-14 h-14" />
                </div>
                <span className="font-black text-xl uppercase tracking-tighter">{t('document')}</span>
              </button>

              <button
                onClick={() => setFormData(p => ({ ...p, shipMethod: 'package' }))}
                className={`group flex flex-col items-center p-10 rounded-3xl border-2 transition-all ${formData.shipMethod === 'package' ? 'border-dhl-red bg-red-50 text-dhl-red' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-dhl-yellow'}`}
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${formData.shipMethod === 'package' ? 'bg-dhl-red text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <DhlIcon name="parcel" className="w-14 h-14" />
                </div>
                <span className="font-black text-xl uppercase tracking-tighter">{t('package')}</span>
              </button>
            </div>

            <div className="w-full pt-6">
              <Input label={t('shipmentDate' as any)} type="date" value={formData.shipDate} onChange={v => setFormData(p => ({ ...p, shipDate: v }))} required min={new Date().toISOString().split('T')[0]} />
            </div>

            {formData.shipMethod === 'document' && (
              <div className="space-y-6 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
                <Input label={t('describeDocuments' as any)} value={formData.documentDescription} onChange={v => setFormData(p => ({ ...p, documentDescription: v }))} required ruleKey="summarizeShipment" showError={showValidationErrors} />
                <Input label={t('shipmentRef' as any)} value={formData.shipmentReference} onChange={v => setFormData(p => ({ ...p, shipmentReference: v }))} ruleKey="shipmentRef" showError={showValidationErrors} />
              </div>
            )}

            {/* Package Specific Flow */}
            {formData.shipMethod === 'package' && (
              <div className="space-y-8 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-4 duration-500">

                {/* Line Items block */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 dark:text-gray-200">{t('whatIsTheItem' as any)}</h4>
                  <div className="space-y-4">
                    {formData.invoice.items.map((item, i) => {
                      const isExpanded = expandedItems[i] !== false;
                      const isLastItem = i === formData.invoice.items.length - 1;
                      const showDescError = isLastItem && itemDescError && (!item.description || item.description.trim() === '');
                      return (
                        <div key={i} className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl relative group transition-all hover:border-gray-200 overflow-hidden">
                          {/* Item Header - always visible */}
                          <button onClick={() => setExpandedItems(prev => ({ ...prev, [i]: !isExpanded }))} className="w-full flex items-center justify-between p-4 text-left">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="bg-dhl-red text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">Item #{i + 1}</span>
                              {isExpanded ? (
                                <span className="font-bold text-gray-700 dark:text-gray-200 truncate">{item.description || `Item #${i + 1}`}</span>
                              ) : (
                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                  {t('itemDescription' as any)}: {item.description || '-'} &nbsp;·&nbsp; {t('quantity' as any)}: {item.quantity} &nbsp;·&nbsp; {t('totalWeight' as any)}: {((item.weight || 0) * (item.quantity || 1)).toFixed(3)} KG &nbsp;·&nbsp; {t('totalItemValue' as any)}: {((item.value || 0) * (item.quantity || 1)).toFixed(3)} {formData.invoice.currency}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {formData.invoice.items.length > 1 && (
                                <span onClick={(e) => { e.stopPropagation(); removeInvoiceItem(i); }} className="text-gray-300 hover:text-dhl-red transition-all p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                  <Trash2 className="w-4 h-4" />
                                </span>
                              )}
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </div>
                          </button>
                          {/* Item Details - collapsible */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                              <Input label={t('whatIsTheItem' as any)} value={item.description} onChange={v => { setItemDescError(false); const n = [...formData.invoice.items]; n[i].description = v; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }} required ruleKey="itemDescription" showError={showDescError || showValidationErrors} />
                              <Input
                                label="Commodity Code"
                                value={item.commodityCode || ''}
                                placeholder="XXXX.XX.XXXXXX"
                                onChange={v => {
                                  let digits = v.replace(/[^0-9]/g, '').slice(0, 12);
                                  let formatted = '';
                                  if (digits.length > 0) formatted += digits.substring(0, 4);
                                  if (digits.length > 4) formatted += '.' + digits.substring(4, 6);
                                  if (digits.length > 6) formatted += '.' + digits.substring(6, 12);

                                  const n = [...formData.invoice.items]; n[i].commodityCode = formatted; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } }))
                                }}
                                ruleKey="commodityCode"
                              />                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Input label={t('quantity' as any)} type="number" value={item.quantity} onChange={v => { const n = [...formData.invoice.items]; n[i].quantity = parseInt(v) || 0; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }} required min={lineItemQuantityMin.toString()} />
                                <div className="space-y-1.5 flex-grow">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Units</label>
                                  <select className="w-full p-4 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold hover:border-gray-200 transition-all border-gray-50 dark:border-gray-700" value={item.units || 'PCS'} onChange={e => { const n = [...formData.invoice.items]; n[i].units = e.target.value; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }}>
                                    {uomData.map((uom: any) => (
                                      <option key={uom.unitOfMeasurement || uom.code} value={uom.unitOfMeasurement || uom.code}>
                                        {uom.description || uom.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Input label={t('weight' as any)} type="number" value={item.weight} onChange={v => { const n = [...formData.invoice.items]; n[i].weight = parseFloat(v) || 0; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }} required min={lineItemWeightMin.toString()} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex-grow">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Value (Per Item)</label>
                                  <div className="flex">
                                    <input type="number" min={lineItemValueMin.toString()} value={item.value} onChange={e => { const n = [...formData.invoice.items]; n[i].value = parseFloat(e.target.value) || 0; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }} className="w-full p-4 rounded-l-xl border-2 border-r-0 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold hover:border-gray-200 transition-all border-gray-50 dark:border-gray-700" />
                                    <select value={formData.invoice.currency} onChange={e => { setFormData(p => ({ ...p, invoice: { ...p.invoice, currency: e.target.value } })) }} className="p-4 rounded-r-xl border-2 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold transition-all border-gray-50 dark:border-gray-600 min-w-[90px]">
                                      {(currenciesData as string[]).map(c => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1.5 flex-grow">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('whereWasItMade' as any)}</label>
                                  <select className="w-full p-4 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold hover:border-gray-200 transition-all border-gray-50 dark:border-gray-700" value={item.origin} onChange={e => { const n = [...formData.invoice.items]; n[i].origin = e.target.value; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }}>
                                    {countries.map(c => (<option key={c.countryCode} value={c.countryCode}>{c.countryName || c.name}</option>))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Add Line Item button BELOW items */}
                  <button onClick={addInvoiceItem} className="w-full text-dhl-red text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-dhl-dark-red transition-all bg-red-50 hover:bg-red-100 p-4 rounded-xl active:scale-[0.98]">
                    <Plus className="w-4 h-4" /> {t('addLineItem' as any)}
                  </button>

                  <div className="p-4 border-t-2 border-dashed dark:border-gray-700 mt-4 text-right space-y-2 font-bold text-lg text-gray-700 dark:text-gray-300">
                    <p>{t('totalUnits' as any)} <span className="text-gray-900 dark:text-white font-black">{formData.invoice.items.reduce((s, a) => s + (a.quantity || 0), 0)}</span></p>
                    <p>{t('totalWeight' as any)} <span className="text-gray-900 dark:text-white font-black">{(formData.invoice.items.reduce((s, a) => s + ((a.weight || 0) * (a.quantity || 1)), 0)).toFixed(3)} KG</span></p>
                    <p>{t('totalValue' as any)} <span className="text-dhl-red font-black">{(formData.invoice.items.reduce((s, a) => s + ((a.value || 0) * (a.quantity || 1)), 0)).toFixed(3)} {formData.invoice.currency}</span></p>
                  </div>
                </div>

                {/* Summarize Shipment & Shipment Ref */}
                <div className="space-y-4">
                  {formData.invoice.items.length > 1 && (
                    <Input label={t('summarizeShipment' as any)} value={formData.summarizeShipment} onChange={v => setFormData(p => ({ ...p, summarizeShipment: v }))} required ruleKey="summarizeShipment" showError={showValidationErrors} />
                  )}
                  <Input label={t('shipmentRef' as any)} value={formData.shipmentReference} onChange={v => setFormData(p => ({ ...p, shipmentReference: v }))} ruleKey="shipmentRef" showError={showValidationErrors} />
                </div>

                {/* Customs Invoice Details */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-3xl space-y-6">
                  <h4 className="font-bold text-gray-700 dark:text-gray-200">{t('customsInvoiceDetails' as any)}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => updateSection('invoice', { creationMode: 'create' })} className={`p-4 border-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${formData.invoice.creationMode === 'create' ? 'border-dhl-red bg-red-50 text-dhl-red shadow-lg shadow-red-500/10' : 'border-gray-200 bg-white text-gray-400 hover:border-dhl-yellow'}`}>{t('createInvoice' as any)}</button>
                    <button onClick={() => updateSection('invoice', { creationMode: 'own' })} className={`p-4 border-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${formData.invoice.creationMode === 'own' ? 'border-dhl-red bg-red-50 text-dhl-red shadow-lg shadow-red-500/10' : 'border-gray-200 bg-white text-gray-400 hover:border-dhl-yellow'}`}>{t('useMyOwnInvoice' as any)}</button>
                  </div>

                  {formData.invoice.creationMode === 'create' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2">
                      <button onClick={() => updateSection('invoice', { type: 'proforma' })} className={`p-4 border-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${formData.invoice.type === 'proforma' ? 'border-dhl-red bg-red-50 text-dhl-red' : 'border-gray-200 bg-white text-gray-400 hover:border-dhl-yellow'}`}>{t('proformaInvoice' as any)}</button>
                      <button onClick={() => updateSection('invoice', { type: 'commercial' })} className={`p-4 border-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${formData.invoice.type === 'commercial' ? 'border-dhl-red bg-red-50 text-dhl-red' : 'border-gray-200 bg-white text-gray-400 hover:border-dhl-yellow'}`}>{t('commercialInvoice' as any)}</button>
                    </div>
                  )}

                  <div className="pt-2">
                    <Input label={t('invoiceNumber' as any)} value={formData.invoice.number} onChange={v => updateSection('invoice', { number: v })} required ruleKey="invoiceNumber" showError={showValidationErrors} />
                  </div>
                </div>

                {/* Protect Shipment (Insurance) */}
                <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-dhl-red/20 rounded-3xl space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.insurance.required} onChange={e => {
                      const checked = e.target.checked;
                      if (checked) {
                        const totalValue = formData.invoice.items.reduce((s, a) => s + ((a.value || 0) * (a.quantity || 1)), 0);
                        setFormData(p => ({ ...p, insurance: { required: true, value: totalValue.toFixed(2) } }));
                      } else {
                        setFormData(p => ({ ...p, insurance: { required: false, value: '' } }));
                      }
                    }} className="w-6 h-6 rounded-md border-gray-300 text-dhl-red focus:ring-dhl-red transition-all cursor-pointer" />
                    <span className="font-bold text-dhl-red uppercase tracking-wide">{t('protectShipment' as any)}</span>
                  </label>
                  {formData.insurance.required && (
                    <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
                      <div className="flex-1">
                        <Input label={t('insuredValue' as any)} type="number" value={formData.insurance.value} disabled />
                      </div>
                      <span className="text-xl font-black text-gray-900 dark:text-white mt-4">{formData.invoice.currency}</span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* STEP 3: PACKAGING */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="card space-y-6">
              <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 pb-4">
                <Package className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase tracking-tight">{t('packageStep')}</h3>
              </div>

              <div className="space-y-4">
                {formData.packages.map((pkg, index) => {
                  return (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl relative group transition-all hover:border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Package #{index + 1}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removePackage(index)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <Input label="Qty" type="number" value={pkg.quantity} onChange={v => {
                            const newPkgs = [...formData.packages];
                            newPkgs[index].quantity = parseInt(v) || 0;
                            setFormData(p => ({ ...p, packages: newPkgs }));
                          }} min={packageQuantityMin.toString()} max={packageQuantityMax.toString()} />
                          <Input label="Weight (KG)" type="number" value={pkg.weight} onChange={v => {
                            const newPkgs = [...formData.packages];
                            newPkgs[index].weight = parseFloat(v) || 0;
                            setFormData(p => ({ ...p, packages: newPkgs }));
                          }} min={packageWeightMin.toString()} max={packageWeightMax.toString()} />
                          <Input label="Width (CM)" type="number" value={pkg.width} onChange={v => {
                            const newPkgs = [...formData.packages];
                            newPkgs[index].width = parseFloat(v) || 0;
                            setFormData(p => ({ ...p, packages: newPkgs }));
                          }} min={packageDimensionsMin.toString()} max={packageDimensionsMax.toString()} />
                          <Input label="Height (CM)" type="number" value={pkg.height} onChange={v => {
                            const newPkgs = [...formData.packages];
                            newPkgs[index].height = parseFloat(v) || 0;
                            setFormData(p => ({ ...p, packages: newPkgs }));
                          }} min={packageDimensionsMin.toString()} max={packageDimensionsMax.toString()} />
                          <Input label="Depth (CM)" type="number" value={pkg.depth} onChange={v => {
                            const newPkgs = [...formData.packages];
                            newPkgs[index].depth = parseFloat(v) || 0;
                            setFormData(p => ({ ...p, packages: newPkgs }));
                          }} min={packageDimensionsMin.toString()} max={packageDimensionsMax.toString()} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button onClick={addPackage} className="w-full utility-button py-3 mt-4 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Piece
                </button>

                <div className="text-right space-y-2 pt-4">
                  <p className="text-sm font-bold">Total Packages: {formData.packages.reduce((sum, p) => sum + p.quantity, 0)}</p>
                  <p className="text-sm font-bold">Total Weight: {totalPackageWeight.toFixed(3)} KG</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT */}
        {currentStep === 4 && (
          <div className="card space-y-8 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 pb-4">
              <CreditCard className="w-6 h-6" />
              <h3 className="text-xl font-bold uppercase tracking-tight">{t('paymentStep')}</h3>
            </div>

            <div className="space-y-6">
              <Input label={t('shipperAccount')} value={formData.payment.shipperAccount} onChange={v => {
                const newShipper = v;
                let newBilling = formData.payment.billingAccount;
                if (formData.payment.billingAccount === formData.payment.shipperAccount) {
                  newBilling = newShipper;
                }
                updateSection('payment', { shipperAccount: newShipper, billingAccount: newBilling });
              }} required ruleKey="accountNumber" inputMode="numeric" pattern="[0-9]*" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="use-shipper-for-billing" checked={formData.payment.billingAccount === formData.payment.shipperAccount} onChange={e => {
                    if (e.target.checked) {
                      updateSection('payment', { billingAccount: formData.payment.shipperAccount });
                    } else {
                      updateSection('payment', { billingAccount: '' });
                    }
                  }} className="w-5 h-5 text-dhl-red focus:ring-dhl-yellow border-gray-300 rounded" />
                  <label htmlFor="use-shipper-for-billing" className="text-sm font-bold">{t('useShipperForBilling')}</label>
                </div>
                {formData.payment.billingAccount !== formData.payment.shipperAccount && (
                  <Input label={t('billingAccount')} value={formData.payment.billingAccount} onChange={v => updateSection('payment', { billingAccount: v })} required ruleKey="accountNumber" inputMode="numeric" pattern="[0-9]*" />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="receiver-pays-checkbox" checked={formData.payment.dutiesRole === 'receiver'} onChange={e => {
                    updateSection('payment', { dutiesRole: e.target.checked ? 'receiver' : 'shipper', dutiesAccount: e.target.checked ? '' : formData.payment.dutiesAccount });
                  }} className="w-5 h-5 text-dhl-red focus:ring-dhl-yellow border-gray-300 rounded" />
                  <label htmlFor="receiver-pays-checkbox" className="text-sm font-bold">{t('receiverWillPay')}</label>
                </div>
                <Input label={t('dutiesAccount')} value={formData.payment.dutiesAccount} onChange={v => updateSection('payment', { dutiesAccount: v })} required={formData.payment.dutiesRole !== 'receiver'} ruleKey="accountNumber" disabled={formData.payment.dutiesRole === 'receiver'} inputMode="numeric" pattern="[0-9]*" />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('incoterm')}</label>
                <select value={formData.payment.incoterm} onChange={e => updateSection('payment', { incoterm: e.target.value })} className="w-full p-4 pr-12 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold transition-all hover:border-gray-200 border-gray-50 dark:border-gray-700">
                  {incotermsData.map((inc: any) => <option key={inc.incoterm} value={inc.incoterm}>{inc.incoterm} - {inc.incotermName}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CUSTOMS DOCS (Invoice) */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="card space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3 text-dhl-red">
                  <FileText className="w-6 h-6" />
                  <h3 className="text-xl font-bold uppercase tracking-tight">{t('docsStep')}</h3>
                </div>
                <button onClick={addInvoiceItem} className="btn-secondary flex items-center gap-2 py-2 px-4 text-xs">
                  <Plus className="w-4 h-4" />
                  {t('addLineItem')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase tracking-widest">
                      <th className="pb-4 pr-4">Description</th>
                      <th className="pb-4 px-4 w-20 text-center">Qty</th>
                      <th className="pb-4 px-4 w-32 text-center">Weight</th>
                      <th className="pb-4 px-4 w-40">Value</th>
                      <th className="pb-4 px-4 w-24">Origin</th>
                      <th className="pb-4 pl-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {formData.invoice.items.map((item, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 pr-4">
                          <input
                            value={item.description}
                            onChange={e => {
                              const items = [...formData.invoice.items];
                              items[i].description = e.target.value;
                              updateSection('invoice', { items });
                            }}
                            className="w-full bg-transparent border-b border-transparent focus:border-dhl-yellow outline-none font-bold py-1"
                            placeholder="What are you shipping?"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => {
                              const items = [...formData.invoice.items];
                              items[i].quantity = parseInt(e.target.value) || 0;
                              updateSection('invoice', { items });
                            }}
                            className="w-full text-center bg-transparent border-b border-transparent focus:border-dhl-yellow outline-none font-bold py-1"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              value={item.weight}
                              onChange={e => {
                                const items = [...formData.invoice.items];
                                items[i].weight = parseFloat(e.target.value) || 0;
                                updateSection('invoice', { items });
                              }}
                              className="w-full text-center bg-transparent border-b border-transparent focus:border-dhl-yellow outline-none font-bold py-1"
                            />
                            <span className="text-[10px] text-gray-400">KG</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.value}
                              onChange={e => {
                                const items = [...formData.invoice.items];
                                items[i].value = parseFloat(e.target.value) || 0;
                                updateSection('invoice', { items });
                              }}
                              className="w-full bg-transparent border-b border-transparent focus:border-dhl-yellow outline-none font-bold py-1"
                            />
                            <span className="text-[10px] font-bold text-dhl-red">THB</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <input
                            value={item.origin}
                            onChange={e => {
                              const items = [...formData.invoice.items];
                              items[i].origin = e.target.value;
                              updateSection('invoice', { items });
                            }}
                            className="w-full text-center bg-transparent border-b border-transparent focus:border-dhl-yellow outline-none font-bold py-1"
                          />
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button onClick={() => removeInvoiceItem(i)} className="text-gray-300 hover:text-dhl-red opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <StatBox label={t('totalUnits')} value={formData.invoice.items.reduce((s, i) => s + i.quantity, 0)} color="text-gray-900" />
                <StatBox label={t('totalWeight')} value={`${totalInvoiceWeight.toFixed(2)} KG`} color="text-gray-900" />
                <StatBox label={t('totalValue')} value={`${totalInvoiceValue.toLocaleString()} THB`} color="text-dhl-red" active />
              </div>
            </div>

            {/* File Uploader */}
            <div className="card bg-gray-50 dark:bg-gray-900/40 border-dashed border-2 border-gray-200 dark:border-gray-800 p-10 text-center space-y-4 group hover:border-dhl-yellow transition-all">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-dhl-red" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Upload Commercial Documents</h4>
                <p className="text-sm text-gray-500">Drag and drop or click to select files (PDF, JPG, PNG)</p>
              </div>
              <input type="file" multiple className="hidden" id="file-upload" onChange={(e) => {
                const files = Array.from(e.target.files || []);
                updateSection('invoice', { uploadedDocs: [...formData.invoice.uploadedDocs, ...files] });
              }} />
              <label htmlFor="file-upload" className="btn-secondary inline-block py-3 px-8 cursor-pointer">Choose Files</label>

              {formData.invoice.uploadedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  {formData.invoice.uploadedDocs.map((f, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border">
                      <FileText className="w-3 h-3" /> {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: PICKUP */}
        {currentStep === 6 && (
          <div className="card space-y-10 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3 text-dhl-red">
                <Truck className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase tracking-tight">{t('pickupStep')}</h3>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => updateSection('pickup', { required: true })}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.pickup.required ? 'bg-dhl-red text-white' : 'text-gray-400'}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => updateSection('pickup', { required: false })}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${!formData.pickup.required ? 'bg-dhl-red text-white' : 'text-gray-400'}`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.pickup.required ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="font-bold text-gray-500 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Schedule Times
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Ready Time" type="time" value={formData.pickup.readyTime} onChange={v => updateSection('pickup', { readyTime: v })} />
                    <Input label="Close Time" type="time" value={formData.pickup.closeTime} onChange={v => updateSection('pickup', { closeTime: v })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
                    <select
                      value={formData.pickup.location}
                      onChange={e => updateSection('pickup', { location: e.target.value })}
                      className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold focus:ring-2 focus:ring-dhl-yellow outline-none"
                    >
                      {['Reception', 'Loading Dock', 'Front Desk', 'Security', 'Other'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-bold text-gray-500 uppercase text-xs tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Pickup Address
                  </h4>
                  <div className="p-6 bg-yellow-50/50 dark:bg-gray-900/50 border border-dhl-yellow/20 rounded-3xl relative">
                    <p className="font-black italic text-dhl-red">{formData.shipper.company || formData.shipper.name}</p>
                    <p className="text-sm opacity-70 mt-1">{formData.shipper.address1}, {formData.shipper.city}</p>
                    <div className="absolute top-4 right-4 bg-dhl-yellow text-dhl-red p-1 rounded-full"><CheckCircle2 className="w-3 h-3" /></div>
                  </div>
                  <Input label="Special Instructions" value={formData.pickup.instructions} onChange={v => updateSection('pickup', { instructions: v })} />
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <Truck className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold">No Pickup Requested</h4>
                <p className="text-sm text-gray-500">You will need to drop off your shipment at a DHL Service Point.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: SUMMARY */}
        {currentStep === 7 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="card space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-dhl-red" />

              <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 pb-4">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase tracking-tight">{t('summary')}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="space-y-8">
                  <SummarySection title={t('shipperInfo' as any)} icon={User}>
                    <p className="font-black italic text-dhl-red text-lg uppercase tracking-tight">{formData.shipper.company || formData.shipper.name}</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{formData.shipper.address1}<br />{formData.shipper.city}, {formData.shipper.country}</p>
                  </SummarySection>

                  <SummarySection title={t('receiverInfo' as any)} icon={MapPin}>
                    <p className="font-black italic text-dhl-red text-lg uppercase tracking-tight">{formData.receiver.company || formData.receiver.name}</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{formData.receiver.address1}<br />{formData.receiver.city}, {formData.receiver.country}</p>
                  </SummarySection>
                </div>

                <div className="space-y-8">
                  <SummarySection title="Shipment Details" icon={Package}>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl space-y-4">
                      <SummaryField label="Method" value={formData.shipMethod.toUpperCase()} />
                      <SummaryField label="Date" value={formData.shipDate} />
                      <SummaryField label="Total Pieces" value={formData.packages.reduce((s, p) => s + p.quantity, 0)} />
                      <SummaryField label="Total Weight" value={`${totalPackageWeight.toFixed(2)} KG`} />
                    </div>
                  </SummarySection>

                  <SummarySection title="Payment" icon={CreditCard}>
                    <SummaryField label="Billing Account" value={formData.payment.billingAccount} />
                    <SummaryField label="Incoterm" value={formData.payment.incoterm} />
                  </SummarySection>
                </div>

                <div className="space-y-8">
                  <SummarySection title="Customs & Docs" icon={FileText}>
                    {formData.shipMethod === 'document' ? (
                      <p className="text-sm font-bold text-gray-400 italic">No customs documents required for Documents.</p>
                    ) : (
                      <div className="space-y-2">
                        <SummaryField label="Invoice Value" value={`${totalInvoiceValue.toLocaleString()} THB`} />
                        <p className="text-[10px] text-gray-400 uppercase font-bold mt-4">Invoice Items</p>
                        <ul className="text-xs font-bold space-y-1">
                          {formData.invoice.items.map((it, idx) => (
                            <li key={idx} className="flex justify-between border-b border-gray-100 py-1">
                              <span>{it.description || 'Item'} x {it.quantity}</span>
                              <span className="text-dhl-red italic">{it.value * it.quantity} THB</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </SummarySection>

                  <SummarySection title="Pickup" icon={Truck}>
                    <p className="text-sm font-bold">{formData.pickup.required ? `Scheduled at ${formData.pickup.readyTime} - ${formData.pickup.closeTime}` : 'Drop-off required'}</p>
                    {formData.pickup.required && <p className="text-xs text-gray-500">{formData.pickup.location}</p>}
                  </SummarySection>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-3xl border-2 border-red-100 dark:border-red-900/30 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-dhl-red rounded-2xl text-white shadow-xl shadow-red-500/20 animate-pulse">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-black text-dhl-red uppercase italic tracking-tighter">Final Verification</h4>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1 max-w-xl leading-relaxed">
                    By clicking "Create Shipment", you verify that all provided information is accurate. Errors in shipping labels may result in delivery delays or additional charges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-8 flex gap-4">
        <button
          disabled={isSubmitting}
          onClick={handlePrev}
          className="flex-1 utility-button flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black uppercase tracking-widest text-xs py-5 transition-all hover:bg-gray-200 disabled:opacity-50 rounded-2xl"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('previous')}
        </button>
        <button
          disabled={isSubmitting}
          onClick={handleNext}
          className={`flex-[2] utility-button flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm py-5 shadow-xl transition-all active:scale-95 disabled:opacity-50 rounded-2xl ${currentStep === 7 ? 'bg-green-600 text-white shadow-green-500/20 hover:bg-green-700' : 'bg-dhl-red text-white shadow-red-500/20 hover:bg-dhl-dark-red'}`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Processing...
            </span>
          ) : (
            <>
              {currentStep === 7 ? t('createShipment') : t('next')}
              {currentStep < 7 && <ChevronRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default ShipPage;
