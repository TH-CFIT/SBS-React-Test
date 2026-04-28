import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  User, MapPin, Package, CreditCard,
  FileText, Truck, ClipboardList,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, Trash2,
  AlertCircle, CheckCircle2, Check, Info, Upload, Clock, List, Globe, XCircle, Printer, Box
} from 'lucide-react';

import countriesData from '../../data/countries.json';
import incotermsData from '../../data/incoterms.json';
import appConfig from '../../data/appConfig.json';
import currenciesData from '../../data/currencies.json';
import documentTypes from '../../data/documentTypes.json';
import uomData from '../../data/uom.json';
import pickupLocations from '../../data/pickupLocations.json';
import { buildShipmentPayload } from '../utils/createShipment';
import PickupWindowSlider from '../components/PickupWindowSlider';
import "nouislider/dist/nouislider.css";


// --- Utils ---
const debounce = (func: Function, delay: number) => {
  let timeout: any;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

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

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '';
  return `https://flagcdn.com/w40/${countryCode.trim().toLowerCase()}.png`;
};

const CountryFlag = ({ code, className = "w-5 h-3.5 object-cover rounded-sm" }: { code: string, className?: string }) => {
  if (!code) return null;
  return <img src={getFlagEmoji(code)} alt={code} className={className} />;
};

const Combobox = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  showError,
  required,
  displayValue = (v: any) => v
}: {
  label: string,
  value: string,
  options: any[],
  onChange: (v: string) => void,
  placeholder?: string,
  showError?: boolean,
  required?: boolean,
  displayValue?: (v: any) => string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync inputText when value changes externally
  useEffect(() => {
    const selectedOption = options.find(opt => (opt.countryCode || opt.code || opt) === value);
    if (selectedOption) {
      setInputText(displayValue(selectedOption));
    } else if (!value) {
      setInputText("");
    }
  }, [value, options]);

  const filteredOptions = options.filter(opt => {
    const text = displayValue(opt).toLowerCase();
    return text.includes(inputText.toLowerCase());
  });

  const selectedOption = options.find(opt => (opt.countryCode || opt.code || opt) === value);
  // Check if current inputText matches any option (for typed-in validation)
  const matchedByText = options.find(opt => displayValue(opt).toLowerCase() === inputText.toLowerCase());
  const isValid = !inputText || matchedByText || selectedOption;
  const isMissing = required && !value && !inputText;
  const isInvalidTyped = inputText && !matchedByText && !selectedOption;
  const hasError = showError && (isMissing || isInvalidTyped);

  const handleInputChange = (text: string) => {
    setInputText(text);
    setIsOpen(true);
    // If text matches an option exactly, select it
    const exactMatch = options.find(opt => displayValue(opt).toLowerCase() === text.toLowerCase());
    if (exactMatch) {
      onChange(exactMatch.countryCode || exactMatch.code || exactMatch);
    } else {
      // Clear selection if text doesn't match
      if (value) onChange('');
    }
  };

  const handleSelect = (opt: any) => {
    const optVal = opt.countryCode || opt.code || opt;
    onChange(optVal);
    setInputText(displayValue(opt));
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="space-y-1.5 flex-grow relative" ref={containerRef}>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <div className={`w-full rounded-xl border-2 bg-white dark:bg-gray-800 flex items-center gap-3 transition-all ${isFocused ? 'border-dhl-yellow ring-2 ring-dhl-yellow/10' : 'hover:border-gray-200'} ${hasError ? 'border-dhl-red ring-4 ring-red-500/10' : 'border-gray-50 dark:border-gray-700'}`}>
          {(selectedOption?.countryCode || selectedOption?.code) && <span className="pl-4 flex-shrink-0"><CountryFlag code={selectedOption.countryCode || selectedOption.code} /></span>}
          <input
            ref={inputRef}
            type="text"
            className={`w-full p-4 bg-transparent outline-none font-bold ${!selectedOption?.countryCode ? 'pl-4' : 'pl-0'}`}
            placeholder={placeholder || "Type to search..."}
            value={inputText}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => { setIsFocused(true); setIsOpen(true); }}
            onBlur={() => setIsFocused(false)}
          />
          {required && !value && !inputText && (
            <span className="pr-4 text-dhl-red font-black text-xl animate-pulse">*</span>
          )}
          {selectedOption && (
            <span className="pr-4"><Check className="text-green-500 w-5 h-5" strokeWidth={3} /></span>
          )}
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-[100] animate-in fade-in zoom-in duration-200">
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
              {filteredOptions.map((opt, i) => {
                const optVal = opt.countryCode || opt.code || opt;
                const isSelected = value === optVal;
                return (
                  <div
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-dhl-red text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                  >
                    {(opt.countryCode || opt.code) && <CountryFlag code={opt.countryCode || opt.code} />}
                    <span className="font-bold text-sm">{displayValue(opt)}</span>
                    {isSelected && <Check className="w-4 h-4 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showError && isMissing && <p className="text-[10px] font-bold text-dhl-red ml-1">This field is required</p>}
      {showError && isInvalidTyped && <p className="text-[10px] font-bold text-dhl-red ml-1">Invalid detail - please select from the list</p>}
    </div>
  );
};

// --- Sub Components ---
const AddressCard = ({ title, data, onChange, countries, bgClass = '', readOnlyCountry = false, showError = false, requiredEmail = true }: { title: string, data: any, onChange: (d: any) => void, countries: any[], bgClass?: string, readOnlyCountry?: boolean, showError?: boolean, requiredEmail?: boolean }) => {
  const { t } = useLanguage();
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find((c: any) => (c.countryCode || c.code) === data.country);
  const mode = selectedCountry?.postalLocationTypeCode || 'CP';

  const showPostal = mode === 'CP';
  const showSuburb = mode === 'S' && 'suburb' in data;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateAddress = async () => {
    if (!data.country) return;
    if (!data.postalCode && !data.city && !data.suburb) return;
    setValidationWarning(null);

    try {
      const params = new URLSearchParams({ countryCode: data.country });
      if (data.postalCode && showPostal) params.append('postalCode', data.postalCode);
      if (data.city) params.append('city', data.city);
      if (data.suburb && showSuburb) params.append('countyName', data.suburb);

      const res = await fetch(`/api/validate-address?${params.toString()}`);
      const contentType = res.headers.get("content-type");

      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        console.warn("Address validation API not available (likely local dev). Deploy to test.");
        return;
      }

      const responseData = await res.json();

      if (!res.ok) {
        if (responseData.details && responseData.details.addressValidationMessage) {
          setValidationWarning(responseData.details.addressValidationMessage);
        } else if (responseData.details && responseData.details.detail) {
          setValidationWarning(responseData.details.detail);
        } else {
          setValidationWarning("Invalid address combination according to DHL.");
        }
      }
    } catch (e) {
      console.error("Address validation check failed:", e);
    }
  };

  const fetchSuggestions = useRef(
    debounce(async (value: string, type: string, country: string) => {
      if (!country || value.length < 2) {
        setShowSuggestions(false);
        return;
      }

      const params = new URLSearchParams({ countryCode: country });
      if (type === 'postalCode') {
        params.append('postalCode', value);
      } else if (type === 'city') {
        if (value.length < 3) {
          setShowSuggestions(false);
          return;
        }
        params.append('city', value);
      } else if (type === 'suburb') {
        if (value.length < 3) {
          setShowSuggestions(false);
          return;
        }
        params.append('countyName', value);
      }

      try {
        const response = await fetch(`/api/validate-address?${params.toString()}`);
        const contentType = response.headers.get("content-type");

        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          setShowSuggestions(false);
          return;
        }

        const result = await response.json();
        const locations = result?.postalLocationList;

        if (!locations || locations.length === 0) {
          setShowSuggestions(false);
          return;
        }

        setSuggestions(locations);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setShowSuggestions(false);
      }
    }, 500)
  ).current;

  const handleSuggestionSelect = (loc: any) => {
    const postalCode = loc.postalCode || '';
    const city = loc.cityName || loc.city || '';
    const suburb = loc.cityDistrict || loc.countyName || '';

    onChange({
      ...data,
      postalCode: postalCode || data.postalCode,
      city: city || data.city,
      suburb: suburb || data.suburb
    });

    setShowSuggestions(false);
    setValidationWarning(null);
  };

  return (
    <div className={`card space-y-6 ${bgClass} transition-shadow hover:shadow-2xl relative`}>
      <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 dark:border-gray-800 pb-4">
        <User className="w-6 h-6" />
        <h3 className="text-xl font-bold uppercase tracking-tight">{title}</h3>
      </div>

      <div className="space-y-4">
        <Input label={t('name' as any)} value={data.name} onChange={(v: any) => onChange({ ...data, name: v })} required ruleKey="name" showError={showError} />
        <Input label={t('company' as any)} value={data.company} onChange={(v: any) => onChange({ ...data, company: v })} required ruleKey="company" showError={showError} />
      </div>

      {readOnlyCountry ? (
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('country' as any)}</label>
          <div className="w-full p-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-900 border-none flex items-center gap-3 opacity-70 cursor-not-allowed">
            {data.country && <CountryFlag code={data.country} />}
            <span className="font-bold text-gray-900 dark:text-white">{selectedCountry?.countryName || selectedCountry?.name || data.country}</span>
          </div>
        </div>
      ) : (
        <Combobox
          label={t('country' as any)}
          value={data.country}
          options={countries}
          onChange={val => {
            if (val !== data.country) {
              onChange({
                ...data,
                country: val,
                postalCode: '',
                city: '',
                suburb: ''
              });
            } else {
              onChange({ ...data, country: val });
            }
            setValidationWarning(null);
          }}
          showError={showError}
          required
          displayValue={(c) => c.countryName || c.name}
          placeholder={t('typeOrSelectCountry' as any)}
        />
      )}

      {data.country && (
        <div className="space-y-6 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-500">

          {validationWarning && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-dhl-yellow rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-dhl-yellow flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{validationWarning}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input label={t('address1' as any)} value={data.address1} onChange={(v: any) => onChange({ ...data, address1: v })} required ruleKey="address1" showError={showError} />
            <Input label={t('address2' as any)} value={data.address2} onChange={(v: any) => onChange({ ...data, address2: v })} ruleKey="address2" showError={showError} />
            <Input label={t('address3' as any)} value={data.address3} onChange={(v: any) => onChange({ ...data, address3: v })} ruleKey="address3" showError={showError} />
          </div>

          <div className="relative">
            <div className={`grid grid-cols-1 ${(showPostal || showSuburb) ? 'md:grid-cols-2' : ''} gap-4`}>
              {showPostal && (
                <Input label={t('postalCode' as any)} value={data.postalCode} onChange={(v: any) => { onChange({ ...data, postalCode: v }); fetchSuggestions(v, 'postalCode', data.country); }} onBlur={validateAddress} required ruleKey="postalcode" showError={showError} />
              )}
              {showSuburb && (
                <Input label={t('suburb' as any)} value={data.suburb} onChange={(v: any) => { onChange({ ...data, suburb: v }); fetchSuggestions(v, 'suburb', data.country); }} onBlur={validateAddress} required ruleKey="suburb" showError={showError} />
              )}
              <Input label={t('city' as any)} value={data.city} onChange={(v: any) => { onChange({ ...data, city: v }); fetchSuggestions(v, 'city', data.country); }} onBlur={validateAddress} required ruleKey="city" showError={showError} />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {suggestions.map((loc, i) => {
                    const pCode = loc.postalCode || '';
                    const cName = loc.cityName || loc.city || '';
                    const sName = loc.cityDistrict || loc.countyName || '';

                    const displayTextParts = [];
                    if (pCode) displayTextParts.push(pCode);
                    if (cName) displayTextParts.push(cName);
                    if (sName && sName.toLowerCase() !== cName.toLowerCase()) {
                      displayTextParts.push(`- ${sName}`);
                    }

                    const displayText = displayTextParts.join(' ');

                    return (
                      <div
                        key={i}
                        onClick={() => handleSuggestionSelect(loc)}
                        className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-all border-b border-gray-50 dark:border-gray-800 last:border-0"
                      >
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{displayText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

const Input = ({ label, value, onChange, onBlur, type = 'text', required, disabled, readOnly, ruleKey, showError, min, max, placeholder, inputMode, pattern }: { label: string, value: any, onChange?: (v: any) => void, onBlur?: () => void, type?: string, required?: boolean, disabled?: boolean, readOnly?: boolean, ruleKey?: string, showError?: boolean, min?: string, max?: string, placeholder?: string, inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search", pattern?: string }) => {
  const { t } = useLanguage();
  const rule = ruleKey ? (appConfig.validationRules as any)[ruleKey] : null;
  const maxLength = rule?.maxLength || rule?.length;
  const currentLength = value?.toString().length || 0;

  const isAtLimit = maxLength && currentLength >= maxLength;
  const isMissingValue = required && (!value || value.toString().trim() === '');

  // Specific Format Validations
  const isEmail = ruleKey === 'email';
  const isPhone = ruleKey === 'phone';

  const isEmailInvalid = isEmail && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhoneTooShort = isPhone && value && value.toString().length < 4;

  const isAccountNumber = ruleKey === 'accountNumber';
  const isAccLengthInvalid = isAccountNumber && value && value.toString().length !== rule?.length;

  // A 'hard error' is something that prevents proceeding (missing or invalid format)
  const isHardError = showError && (isMissingValue || isEmailInvalid || isPhoneTooShort || isAccLengthInvalid);

  const handleTextChange = (v: string) => {
    let sanitized = v;

    if (type === 'date') {
      onChange?.(v);
      return;
    }

    if (type === 'number') {
      // Allow user to type decimals freely, but the value is passed through as-is
      // The step=1 on the input element controls arrow key behavior (integers)
      // Users can still manually type decimals like 0.5
      onChange?.(v);
      return;
    }

    if (isPhone) {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    } else if (ruleKey === 'accountNumber') {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    } else {
      sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
    }

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    onChange?.(sanitized);
  };

  return (
    <div className="space-y-1.5 flex-grow">
      {label && <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => handleTextChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          min={min}
          max={max}
          step={type === 'number' ? 'any' : undefined}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
          className={`w-full p-4 pr-12 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700' : 'hover:border-gray-200'} ${readOnly ? 'bg-gray-50 dark:bg-gray-900 border-none' : ''} ${isHardError ? 'border-dhl-red ring-4 ring-red-500/10' : 'border-gray-50 dark:border-gray-700'}`}
        />
        {required && !value && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dhl-red font-black text-xl animate-pulse pointer-events-none">*</span>
        )}
        {required && !!value && !isEmailInvalid && !isPhoneTooShort && (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5 animate-in zoom-in pointer-events-none" strokeWidth={3} />
        )}
      </div>
      {showError && isMissingValue && (
        <p className="text-[10px] font-bold text-dhl-red ml-1 animate-in fade-in slide-in-from-top-1">This field is required</p>
      )}
      {showError && isAccLengthInvalid && !isMissingValue && (
        <p className="text-[10px] font-bold text-dhl-red ml-1 animate-in fade-in slide-in-from-top-1">
          Account number must be exactly {rule?.length} digits
        </p>
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
  <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-2 gap-4">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">{label}</span>
    <span className="text-sm font-black text-gray-900 dark:text-white italic text-right break-words min-w-0 flex-1">{value}</span>
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
  const [validationMessage, setValidationMessage] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({ 0: true });
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [printSize, setPrintSize] = useState<'A4' | 'Label' | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [pickupValidationWarning, setPickupValidationWarning] = useState<string | null>(null);
  const pickupSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupSuggestionsRef.current && !pickupSuggestionsRef.current.contains(event.target as Node)) {
        setShowPickupSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validatePickupAddress = async () => {
    if (!tempPickupAddress.country) return;
    if (!tempPickupAddress.postalCode && !tempPickupAddress.city) return;
    setPickupValidationWarning(null);

    try {
      const params = new URLSearchParams({ countryCode: tempPickupAddress.country });
      if (tempPickupAddress.postalCode) params.append('postalCode', tempPickupAddress.postalCode);
      if (tempPickupAddress.city) params.append('city', tempPickupAddress.city);

      const res = await fetch(`/api/validate-address?${params.toString()}`);
      const contentType = res.headers.get("content-type");

      if (!res.ok || !contentType || !contentType.includes("application/json")) return;

      const responseData = await res.json();
      if (!res.ok) {
        setPickupValidationWarning(responseData.details?.addressValidationMessage || responseData.details?.detail || "Invalid address combination according to DHL.");
      }
    } catch (e) {
      console.error("Address validation check failed:", e);
    }
  };

  const fetchPickupSuggestions = useRef(
    debounce(async (value: string, type: string, country: string) => {
      if (!country || value.length < 2) {
        setShowPickupSuggestions(false);
        return;
      }
      const params = new URLSearchParams({ countryCode: country });
      if (type === 'postalCode') params.append('postalCode', value);
      else if (type === 'city') {
        if (value.length < 3) { setShowPickupSuggestions(false); return; }
        params.append('city', value);
      }
      try {
        const response = await fetch(`/api/validate-address?${params.toString()}`);
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType?.includes("application/json")) { setShowPickupSuggestions(false); return; }
        const result = await response.json();
        const locations = result?.postalLocationList;
        if (!locations || locations.length === 0) { setShowPickupSuggestions(false); return; }
        setPickupSuggestions(locations);
        setShowPickupSuggestions(true);
      } catch (error) {
        setShowPickupSuggestions(false);
      }
    }, 500)
  ).current;

  const handlePickupSuggestionSelect = (loc: any) => {
    setTempPickupAddress({
      ...tempPickupAddress,
      postalCode: loc.postalCode || tempPickupAddress.postalCode,
      city: loc.cityName || loc.city || tempPickupAddress.city,
    });
    setShowPickupSuggestions(false);
    setPickupValidationWarning(null);
  };

  const handleFileAction = (files: File[]) => {
    if (files.length === 0) return;

    // Validate 1 file only
    if (files.length > 1 || formData.invoice.uploadedDocs.length >= 1) {
      setValidationMessage('You can upload only 1 file. Please remove the existing file before uploading a new one.');
      setShowValidationErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const file = files[0];

    // Validate file size not over 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationMessage('File size must not exceed 5MB.');
      setShowValidationErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate file type
    const allowedExtensions = ['jpg', 'jpe', 'jpeg', 'gif', 'png', 'tiff', 'tif', 'pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExtension)) {
      setValidationMessage('Invalid file type. Allowed types: JPG, JPE, JPEG, GIF, PNG, TIFF, TIF, PDF.');
      setShowValidationErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // English only check
    const englishOnly = /^[A-Za-z0-9\s._-]+$/.test(file.name);
    if (!englishOnly) {
      setValidationMessage('File name must be in English characters only.');
      setShowValidationErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setShowValidationErrors(false);
    updateSection('invoice', { uploadedDocs: [file] });
  };

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

  // Compute initial pickup times based on current time
  const getInitialPickupState = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let shipDate = now.toISOString().split('T')[0];
    let readyMin = Math.ceil(currentMinutes / 30) * 30;

    if (currentMinutes > 990) { // After 4:30 PM
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      shipDate = nextDay.toISOString().split('T')[0];
      readyMin = 540; // Default 9:00 AM next day
    } else {
      readyMin = Math.max(540, readyMin); // Min 9:00 AM today
    }

    const closeMin = Math.min(readyMin + 90, 1080);
    const toStr = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
    
    return { 
      shipDate, 
      readyTime: toStr(readyMin), 
      closeTime: toStr(closeMin) 
    };
  };

  const initialPickupState = getInitialPickupState();

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Addresses
    shipper: (() => {
      const saved = localStorage.getItem('shipperData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved shipper data:", e);
        }
      }
      return { name: '', company: '', address1: '', address2: '', address3: '', city: '', postalCode: '', phone: '', email: '', country: 'TH', vat: '' };
    })(),
    receiver: { name: '', company: '', address1: '', address2: '', address3: '', city: '', postalCode: '', phone: '', email: '', country: '', vat: '', suburb: '' },

    // Step 2: Shipment Method & Details
    shipMethod: 'package' as 'package' | 'document',
    shipDate: initialPickupState.shipDate,
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
      incoterm: 'DDP',
      paymentRole: 'shipper',
      dutiesRole: 'receiver',
      useShipperForBilling: true
    },

    // Step 5: Customs Docs (Invoice items & docs)
    invoice: {
      creationMode: 'own' as 'create' | 'own',
      type: 'commercial' as 'commercial' | 'proforma',
      number: '',
      currency: 'THB',
      items: [{ description: '', quantity: 1, weight: 0.5, value: 1, origin: 'TH', units: 'PCS', commodityCode: '' }],
      uploadedDocs: [] as File[],
      uploadDocuments: false,
      optionalUpload: false,
    },

    // Step 6: Pickup
    pickup: {
      required: true,
      location: pickupLocations[0] || 'Reception',
      instructions: '',
      readyTime: initialPickupState.readyTime,
      closeTime: initialPickupState.closeTime,
      address: { name: '', company: '', address1: '', address2: '', address3: '', city: '', postalCode: '', phone: '', country: 'TH' },
      isAddressManuallyEdited: false
    }
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/address-reference?datasetName=country');
        const contentType = response.headers.get("content-type");

        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error('API fetch failed or returned non-JSON (likely local dev)');
        }

        const data = await response.json();
        const transformed = transformCountryData(data);

        // Apply VN override logic from legacy appConfig.json if needed
        // "overrideConditions": { "VN": "S" }
        const finalized = transformed.map((c: any) => {
          if (c.countryCode === 'VN') return { ...c, postalLocationTypeCode: 'S' };
          return c;
        }).filter((c: any, index: number, arr: any[]) => arr.findIndex((c2: any) => c2.countryCode === c.countryCode) === index);

        setCountries(finalized);
        setFormData(prev => ({ ...prev, receiver: { ...prev.receiver, country: '' } }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching live country data, falling back to local:", error);
        if (countriesData && countriesData.length > 0) {
          const uniqueCountries = countriesData.filter((c: any, index: number, arr: any[]) => arr.findIndex((c2: any) => c2.code === c.code) === index);
          setCountries(uniqueCountries);
          setFormData(prev => ({ ...prev, receiver: { ...prev.receiver, country: '' } }));
        }
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        address: {
          name: prev.shipper.name,
          company: prev.shipper.company,
          address1: prev.shipper.address1,
          address2: prev.shipper.address2,
          address3: prev.shipper.address3,
          city: prev.shipper.city,
          postalCode: prev.shipper.postalCode,
          phone: prev.shipper.phone,
          country: prev.shipper.country
        }
      }
    }));
  }, [formData.shipper]);

  useEffect(() => {
    localStorage.setItem('shipperData', JSON.stringify(formData.shipper));
  }, [formData.shipper]);

  // Sync pickup timing when date changes
  useEffect(() => {
    const minStart = getMinReadyTime();
    const currentStart = toMinutes(formData.pickup.readyTime);
    const today = new Date().toISOString().split('T')[0];

    // User wants "immersive": when first time select date in another day (future), 
    // it should snap to the earliest possible slot (9:30 AM).
    if (formData.shipDate !== today) {
      // Future date selected: snap to 09:30 (absoluteMin is 570)
      updateSection('pickup', {
        readyTime: toTimeString(570),
        closeTime: toTimeString(750) // 12:30 (margin of 180 mins)
      });
    } else {
      // Change back to today: if current start is invalid, snap to minStart
      if (currentStart < minStart) {
        updateSection('pickup', {
          readyTime: toTimeString(minStart),
          closeTime: toTimeString(Math.min(1080, minStart + 180)) // ensure 3h window if possible
        });
      }
    }
  }, [formData.shipDate]);

  const steps = [
    { id: 1, name: 'addressStep', icon: MapPin },
    { id: 2, name: 'shipmentDetailsStep', icon: List },
    { id: 3, name: 'packageStep', icon: Package },
    { id: 4, name: 'paymentStep', icon: CreditCard },
    { id: 5, name: 'docsStep', icon: FileText },
    { id: 6, name: 'pickupStep', icon: Truck },
    { id: 7, name: 'summaryStep', icon: CheckCircle2 },
  ];

  const [isEditingPickupAddress, setIsEditingPickupAddress] = useState(false);
  const [tempPickupAddress, setTempPickupAddress] = useState(formData.pickup.address);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    const displayHours = (h % 12) || 12;
    const ampm = h < 12 || h === 24 ? 'am' : 'pm';
    return `${displayHours}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getMinReadyTime = () => {
    const today = new Date().toISOString().split('T')[0];
    const absoluteMin = 570; // 09:30 AM
    if (formData.shipDate === today) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const rounded = Math.ceil(currentMinutes / 30) * 30;
      return Math.max(absoluteMin, Math.min(rounded, 990)); // Cap at 16:30 to allow 90m window
    }
    return absoluteMin;
  };

  const toMinutes = (time: string) => {
    if (!time) return 570; // 09:30
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeString = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentStep === 6) {
      if (isEditingPickupAddress) {
        setShowValidationErrors(true);
        setValidationMessage(t('savePickupAddressError' as any) || "Please \"Save\" the pickup address before proceeding");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const minStart = getMinReadyTime();
      const currentStart = toMinutes(formData.pickup.readyTime);
      if (currentStart < minStart) {
        // Auto-correct instead of showing error
        const newReady = toTimeString(minStart);
        const newClose = toTimeString(Math.min(1080, minStart + 180));
        updateSection('pickup', { readyTime: newReady, closeTime: newClose });
        formData.pickup.readyTime = newReady;
        formData.pickup.closeTime = newClose;
      }
    }

    if (currentStep === 5) {
      const { invoice } = formData;
      const errors: string[] = [];

      if (invoice.uploadDocuments) {
        if (invoice.creationMode === 'own' && invoice.uploadedDocs.length === 0) {
          errors.push('Please upload your commercial invoice.');
        }
        if (invoice.creationMode === 'create' && invoice.optionalUpload && invoice.uploadedDocs.length === 0) {
          errors.push('Please upload your supporting documents or uncheck the upload option.');
        }
      }

      if (errors.length > 0) {
        setShowValidationErrors(true);
        setValidationMessage(errors.join(' • '));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep === 1) {
      const { shipper, receiver } = formData;
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      const errors: string[] = [];
      if (!shipper.name) errors.push('Shipper Name is required');
      if (!shipper.company) errors.push('Shipper Company is required');
      if (!shipper.address1) errors.push('Shipper Address is required');
      if (!shipper.city) errors.push('Shipper City is required');
      if (!shipper.phone) errors.push('Shipper Phone is required');
      if (!shipper.email) errors.push('Shipper Email is required');
      else if (!isValidEmail(shipper.email)) errors.push('Shipper Email is invalid');

      // Check receiver country is valid (must match a country in the list)
      const receiverCountryValid = countries.find((c: any) => c.countryCode === receiver.country);
      if (!receiver.name) errors.push('Receiver Name is required');
      if (!receiver.company) errors.push('Receiver Company is required');
      if (!receiver.country) errors.push('Receiver Country is required');
      else if (!receiverCountryValid) errors.push('Receiver Country is invalid - please select from the list');
      if (!receiver.address1) errors.push('Receiver Address is required');
      if (!receiver.city) errors.push('Receiver City is required');
      if (!receiver.phone) errors.push('Receiver Phone is required');
      if (receiver.email && !isValidEmail(receiver.email)) errors.push('Receiver Email is invalid');

      if (errors.length > 0) {
        setShowValidationErrors(true);
        setValidationMessage(errors.join(' • '));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep === 2) {
      const { shipMethod, shipDate, documentDescription, invoice, summarizeShipment } = formData;
      const errors: string[] = [];

      if (!shipDate) errors.push('Shipment Date is required');

      if (shipMethod === 'document') {
        // Validate document description is in list
        const validDoc = documentTypes.includes(documentDescription);
        if (!documentDescription.trim()) errors.push('Document description is required');
        else if (!validDoc) errors.push('Document description is invalid - please select from the list');
      } else {
        const hasItems = invoice.items.length > 0;
        const allItemsHaveDesc = invoice.items.every(item => item.description && item.description.trim() !== '');
        const needsSummary = invoice.items.length > 1;
        const hasSummary = summarizeShipment && summarizeShipment.trim() !== '';

        if (!hasItems) errors.push('At least one line item is required');
        if (!allItemsHaveDesc) errors.push('All line items must have a description');
        if (needsSummary && !hasSummary) errors.push('Summarize shipment is required when there are multiple items');

        invoice.items.forEach((item, i) => {
          if (item.quantity < appConfig.validationRules.lineItem.quantity.min) errors.push(`Item #${i + 1} Qty must be at least ${appConfig.validationRules.lineItem.quantity.min}`);
          if (item.weight < appConfig.validationRules.lineItem.weight.min) errors.push(`Item #${i + 1} Weight must be at least ${appConfig.validationRules.lineItem.weight.min}`);
          if (item.value < appConfig.validationRules.lineItem.value.min) errors.push(`Item #${i + 1} Value must be at least ${appConfig.validationRules.lineItem.value.min}`);
        });
      }

      if (errors.length > 0) {
        setShowValidationErrors(true);
        setValidationMessage(errors.join(' • '));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep === 3) {
      const errors: string[] = [];
      const newFieldErrorMap: Record<string, boolean> = {};
      const rules = appConfig.validationRules.package;

      const totalPkgQty = formData.packages.reduce((sum, p) => sum + (p.quantity || 0), 0);
      if (totalPkgQty < rules.quantity.min || totalPkgQty > rules.quantity.max) {
        errors.push(`Total Packages must be between ${rules.quantity.min} and ${rules.quantity.max} (Current total: ${totalPkgQty})`);
        formData.packages.forEach((_, i) => { newFieldErrorMap[`pkg-qty-${i}`] = true; });
      }

      formData.packages.forEach((pkg, idx) => {
        if (pkg.weight < rules.weight.min || pkg.weight > rules.weight.max) {
          errors.push(`Package #${idx + 1} Weight must be between ${rules.weight.min} and ${rules.weight.max}`);
          newFieldErrorMap[`pkg-weight-${idx}`] = true;
        }
        if (pkg.width < rules.dimensions.min || pkg.width > rules.dimensions.max) {
          errors.push(`Package #${idx + 1} Width must be between ${rules.dimensions.min} and ${rules.dimensions.max}`);
          newFieldErrorMap[`pkg-width-${idx}`] = true;
        }
        if (pkg.height < rules.dimensions.min || pkg.height > rules.dimensions.max) {
          errors.push(`Package #${idx + 1} Height must be between ${rules.dimensions.min} and ${rules.dimensions.max}`);
          newFieldErrorMap[`pkg-height-${idx}`] = true;
        }
        if (pkg.depth < rules.dimensions.min || pkg.depth > rules.dimensions.max) {
          errors.push(`Package #${idx + 1} Depth must be between ${rules.dimensions.min} and ${rules.dimensions.max}`);
          newFieldErrorMap[`pkg-depth-${idx}`] = true;
        }
      });

      if (errors.length > 0) {
        setShowValidationErrors(true);
        setValidationMessage(errors.join(' • '));
        setValidationErrors(newFieldErrorMap);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep === 4) {
      const requiredLength = appConfig.validationRules.accountNumber.length;
      const { payment } = formData;
      const isValidAcc = (acc: string) => acc && acc.length === requiredLength;
      const errors: string[] = [];

      if (!isValidAcc(payment.shipperAccount)) errors.push(`Shipper Account must be ${requiredLength} digits`);
      if (!isValidAcc(payment.billingAccount)) errors.push(`Billing Account must be ${requiredLength} digits`);
      if (payment.dutiesRole !== 'receiver' && !isValidAcc(payment.dutiesAccount)) errors.push(`Duties & Taxes Account must be ${requiredLength} digits`);
      if (!payment.incoterm) errors.push('Incoterm is required');

      if (errors.length > 0) {
        setShowValidationErrors(true);
        setValidationMessage(errors.join(' • '));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep < 7) {
      setShowValidationErrors(false);
      setValidationMessage('');
      setValidationErrors({});
      if (formData.shipMethod === 'document' && currentStep === 4) {
        setCurrentStep(6);
      } else {
        setCurrentStep(currentStep + 1);
      }
      window.scrollTo(0, 0);
    } else {
      if (!printSize) {
        setShowValidationErrors(true);
        setValidationMessage(t('selectPrintSizeError' as any) || "Please select a print size before creating the shipment");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      handleFinalSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      if (formData.shipMethod === 'document' && currentStep === 6) {
        setCurrentStep(4);
      } else {
        setCurrentStep(currentStep - 1);
      }
      window.scrollTo(0, 0);
    } else {
      onBack();
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 1. Build the real payload including the printSize
      const payload = buildShipmentPayload({ ...formData, printSize }, false);

      console.log("DEBUG: Final Payload for API:", JSON.stringify(payload, null, 2));

      // 2. Call the Vercel API Proxy
      const response = await fetch('/api/ship', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // Success: result expected to have waybill, documents, etc.
        setIsSubmitting(false);
        onFinish(data);
      } else {
        // API Error logic
        const errorMsg = data.detail || data.message || "An error occurred with the DHL API";
        const additionalErrors = data.additionalMessages?.map((m: any) => m.description).join(' • ') || "";

        setShowValidationErrors(true);
        setValidationMessage(`${errorMsg}${additionalErrors ? ` (${additionalErrors})` : ''}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmitting(false);
      }
    } catch (e: any) {
      console.error("Submission Error:", e);
      setShowValidationErrors(true);
      setValidationMessage(e.message || "Network error while connecting to the proxy.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        items: [...prev.invoice.items, { description: '', quantity: 1, weight: 0.5, value: 1, origin: 'TH', units: 'PCS', commodityCode: '' }]
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
              <div
                className={`flex flex-col items-center gap-2 min-w-fit px-4 transition-all ${isDisabled ? 'opacity-30 cursor-not-allowed' : (isCompleted ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed')}`}
                onClick={() => {
                  if (isCompleted && !isDisabled) {
                    setCurrentStep(step.id);
                  }
                }}
              >
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

      {/* Validation Error Banner */}
      {showValidationErrors && validationMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-dhl-red rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 shadow-lg shadow-red-500/10">
          <div className="p-2 bg-dhl-red rounded-xl text-white flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h4 className="font-black text-dhl-red uppercase tracking-tight text-sm mb-1">{t('fillAllFields')}</h4>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{validationMessage}</p>
          </div>
        </div>
      )}

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
              showError={showValidationErrors}
              requiredEmail={false}
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
                <Combobox
                  label={t('describeDocuments' as any)}
                  value={formData.documentDescription}
                  options={documentTypes}
                  onChange={v => setFormData(p => ({ ...p, documentDescription: v }))}
                  showError={showValidationErrors}
                  required
                />
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
                        <div key={i} className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl relative group transition-all hover:border-gray-200">
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
                                <Input label={t('quantity' as any)} type="number" value={item.quantity} onChange={v => { const n = [...formData.invoice.items]; n[i].quantity = parseInt(v) || 0; setFormData(p => { const newState = { ...p, invoice: { ...p.invoice, items: n } }; if (p.insurance.required) { const totalValue = n.reduce((s, a) => s + ((a.value || 0) * (a.quantity || 1)), 0); newState.insurance = { required: true, value: totalValue.toFixed(2) }; } return newState; }) }} required min={appConfig.validationRules.lineItem.quantity.min.toString()} />
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
                                <Input label={t('weight' as any)} type="number" value={item.weight} onChange={v => { const n = [...formData.invoice.items]; n[i].weight = parseFloat(v) || 0; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }} required min={appConfig.validationRules.lineItem.weight.min.toString()} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 flex-grow">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Value (Per Item)</label>
                                  <div className="flex">
                                    <input type="number" step="any" min={appConfig.validationRules.lineItem.value.min.toString()} value={item.value} onChange={e => { const n = [...formData.invoice.items]; n[i].value = parseFloat(e.target.value) || 0; setFormData(p => { const newState = { ...p, invoice: { ...p.invoice, items: n } }; if (p.insurance.required) { const totalValue = n.reduce((s, a) => s + ((a.value || 0) * (a.quantity || 1)), 0); newState.insurance = { required: true, value: totalValue.toFixed(2) }; } return newState; }) }} className="w-full p-4 rounded-l-xl border-2 border-r-0 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold hover:border-gray-200 transition-all border-gray-50 dark:border-gray-700" />
                                    <select value={formData.invoice.currency} onChange={e => { setFormData(p => ({ ...p, invoice: { ...p.invoice, currency: e.target.value } })) }} className="p-4 rounded-r-xl border-2 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold transition-all border-gray-50 dark:border-gray-600 min-w-[90px]">
                                      {(currenciesData as string[]).map(c => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                  </div>
                                </div>
                                <Combobox
                                  label={t('whereWasItMade' as any)}
                                  value={item.origin}
                                  options={countries}
                                  onChange={v => { const n = [...formData.invoice.items]; n[i].origin = v; setFormData(p => ({ ...p, invoice: { ...p.invoice, items: n } })) }}
                                  displayValue={(c) => c.countryName || c.name}
                                  showError={showValidationErrors}
                                  required
                                  placeholder={t('typeOrSelectCountry' as any)}
                                />
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

              </div>
            )}

            {/* Protect Shipment (Insurance) - shown for BOTH document & package */}
            <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-dhl-red/20 rounded-3xl space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.insurance.required} onChange={e => {
                  const checked = e.target.checked;
                  if (checked) {
                    if (formData.shipMethod === 'package') {
                      const totalValue = formData.invoice.items.reduce((s, a) => s + ((a.value || 0) * (a.quantity || 1)), 0);
                      setFormData(p => ({ ...p, insurance: { required: true, value: totalValue.toFixed(2) } }));
                    } else {
                      setFormData(p => ({ ...p, insurance: { required: true, value: '1' } }));
                    }
                  } else {
                    setFormData(p => ({ ...p, insurance: { required: false, value: '' } }));
                  }
                }} className="w-6 h-6 rounded-md border-gray-300 text-dhl-red focus:ring-dhl-red transition-all cursor-pointer" />
                <span className="font-bold text-dhl-red uppercase tracking-wide">{t('protectShipment' as any)}</span>
              </label>
              {formData.insurance.required && formData.shipMethod === 'package' && (
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
                          <Input
                            label="Qty"
                            type="number"
                            value={pkg.quantity}
                            onChange={v => {
                              const newPkgs = [...formData.packages];
                              newPkgs[index].quantity = parseInt(v) || 0;
                              setFormData(p => ({ ...p, packages: newPkgs }));
                            }}
                            min={appConfig.validationRules.package.quantity.min.toString()}
                            max={appConfig.validationRules.package.quantity.max.toString()}
                            showError={showValidationErrors && validationErrors[`pkg-qty-${index}`]}
                          />
                          <Input
                            label="Weight (KG)"
                            type="number"
                            value={pkg.weight}
                            onChange={v => {
                              const newPkgs = [...formData.packages];
                              newPkgs[index].weight = parseFloat(v) || 0;
                              setFormData(p => ({ ...p, packages: newPkgs }));
                            }}
                            min={appConfig.validationRules.package.weight.min.toString()}
                            max={appConfig.validationRules.package.weight.max.toString()}
                            showError={showValidationErrors && validationErrors[`pkg-weight-${index}`]}
                          />
                          <Input
                            label="Width (CM)"
                            type="number"
                            value={pkg.width}
                            onChange={v => {
                              const newPkgs = [...formData.packages];
                              newPkgs[index].width = parseFloat(v) || 0;
                              setFormData(p => ({ ...p, packages: newPkgs }));
                            }}
                            min={appConfig.validationRules.package.dimensions.min.toString()}
                            max={appConfig.validationRules.package.dimensions.max.toString()}
                            showError={showValidationErrors && validationErrors[`pkg-width-${index}`]}
                          />
                          <Input
                            label="Height (CM)"
                            type="number"
                            value={pkg.height}
                            onChange={v => {
                              const newPkgs = [...formData.packages];
                              newPkgs[index].height = parseFloat(v) || 0;
                              setFormData(p => ({ ...p, packages: newPkgs }));
                            }}
                            min={appConfig.validationRules.package.dimensions.min.toString()}
                            max={appConfig.validationRules.package.dimensions.max.toString()}
                            showError={showValidationErrors && validationErrors[`pkg-height-${index}`]}
                          />
                          <Input
                            label="Depth (CM)"
                            type="number"
                            value={pkg.depth}
                            onChange={v => {
                              const newPkgs = [...formData.packages];
                              newPkgs[index].depth = parseFloat(v) || 0;
                              setFormData(p => ({ ...p, packages: newPkgs }));
                            }}
                            min={appConfig.validationRules.package.dimensions.min.toString()}
                            max={appConfig.validationRules.package.dimensions.max.toString()}
                            showError={showValidationErrors && validationErrors[`pkg-depth-${index}`]}
                          />
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
                if (formData.payment.useShipperForBilling) {
                  newBilling = newShipper;
                }
                updateSection('payment', { shipperAccount: newShipper, billingAccount: newBilling });
              }} required ruleKey="accountNumber" inputMode="numeric" pattern="[0-9]*" placeholder="DHL Account Number" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="use-shipper-for-billing" checked={formData.payment.useShipperForBilling} onChange={e => {
                    const isChecked = e.target.checked;
                    updateSection('payment', { useShipperForBilling: isChecked, billingAccount: isChecked ? formData.payment.shipperAccount : '' });
                  }} className="w-5 h-5 text-dhl-red focus:ring-dhl-yellow border-gray-300 rounded" />
                  <label htmlFor="use-shipper-for-billing" className="text-sm font-bold">{t('useShipperForBilling')}</label>
                </div>
                {!formData.payment.useShipperForBilling && (
                  <Input label={t('billingAccount')} value={formData.payment.billingAccount} onChange={v => updateSection('payment', { billingAccount: v })} required ruleKey="accountNumber" inputMode="numeric" pattern="[0-9]*" placeholder="DHL Account Number" />
                )}
              </div>

              {formData.shipMethod !== 'document' && (
                <>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('dutiesAccount')}</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 hover:border-dhl-yellow transition-all">
                        <input type="checkbox" id="receiver-pays-checkbox" checked={formData.payment.dutiesRole === 'receiver'} onChange={e => {
                          updateSection('payment', { dutiesRole: e.target.checked ? 'receiver' : 'shipper', dutiesAccount: e.target.checked ? '' : formData.payment.dutiesAccount });
                        }} className="w-5 h-5 text-dhl-red focus:ring-dhl-yellow border-gray-300 rounded" />
                        <span className="text-sm font-bold whitespace-nowrap">{t('receiverWillPay')}</span>
                      </label>
                      {formData.payment.dutiesRole !== 'receiver' && (
                        <div className="flex-grow">
                          <Input label="" value={formData.payment.dutiesAccount} onChange={v => updateSection('payment', { dutiesAccount: v })} required ruleKey="accountNumber" inputMode="numeric" pattern="[0-9]*" placeholder="DHL Account Number" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('incoterm')}</label>
                    <select value={formData.payment.incoterm} onChange={e => updateSection('payment', { incoterm: e.target.value })} className="w-full p-4 pr-12 rounded-xl border-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-dhl-yellow outline-none font-bold transition-all hover:border-gray-200 border-gray-50 dark:border-gray-700">
                      {incotermsData.map((inc: any) => <option key={inc.incoterm} value={inc.incoterm}>{inc.incoterm} - {inc.incotermName}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: CUSTOMS DOCS (Uploads) */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="card space-y-6">
              <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 pb-4">
                <FileText className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase tracking-tight">{t('docsStep')}</h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('uploadDocsDesc1' as any) || "To speed up the clearance process, you can upload your commercial documents for this shipment."}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('uploadDocsDesc2' as any) || "This is especially helpful for international shipments requiring customs clearance."}
                </p>

                <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                    {t('uploadDocsQuestion' as any) || "Do you want to upload your commercial documents?"}
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <input
                      type="checkbox"
                      checked={formData.invoice.uploadDocuments}
                      onChange={e => updateSection('invoice', { uploadDocuments: e.target.checked })}
                      className="w-6 h-6 rounded-md border-gray-300 text-dhl-red focus:ring-dhl-red transition-all cursor-pointer"
                    />
                    <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wide group-hover:text-dhl-red transition-colors">
                      {t('yes' as any) || "Yes"}
                    </span>
                  </label>
                </div>

                {formData.invoice.uploadDocuments && (
                  <div className="animate-in slide-in-from-top-4 duration-300 space-y-6 pt-6 border-t border-gray-50 dark:border-gray-800">
                    {formData.invoice.creationMode === 'own' ? (
                      <div>
                        <p className="text-sm font-black text-dhl-red uppercase italic mb-4">
                          {t('uploadLabelOwnInvoice' as any) || "Please upload your own commercial invoice below."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-black text-dhl-red uppercase italic mb-2">
                          {t('uploadLabelCreateInvoice' as any) || "Since you chose to create an invoice, you can optionally upload other documents."}
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                          <input
                            type="checkbox"
                            checked={formData.invoice.optionalUpload}
                            onChange={e => updateSection('invoice', { optionalUpload: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-dhl-red focus:ring-dhl-red transition-all cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-gray-900 transition-colors">
                            {t('uploadOptional' as any) || "Upload other optional documents"}
                          </span>
                        </label>
                      </div>
                    )}

                    {(formData.invoice.creationMode === 'own' || formData.invoice.optionalUpload) && (
                      <div className="space-y-4">
                        <div
                          className={`card bg-gray-50 dark:bg-gray-900/40 border-dashed border-2 p-10 text-center space-y-4 group transition-all ${isDragging ? 'border-dhl-red bg-red-50/50' : 'border-gray-200 dark:border-gray-800 hover:border-dhl-yellow'}`}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            handleFileAction(Array.from(e.dataTransfer.files));
                          }}
                        >
                          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-dhl-red" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold">
                              {formData.invoice.creationMode === 'own' ? 'Upload Commercial Invoice' : 'Upload Additional Documents'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {t('browseForFile' as any) || 'Browse for file'} {t('orDropHere' as any) || 'or drop here'}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            id="file-upload"
                            onChange={(e) => handleFileAction(Array.from(e.target.files || []))}
                          />
                          <label htmlFor="file-upload" className="btn-secondary inline-block py-3 px-8 cursor-pointer shadow-sm hover:shadow-md transition-all">
                            Choose File
                          </label>

                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest space-y-1">
                            <p>{t('fileTypesAllowed' as any) || 'Allowed: JPG, JPE, JPEG, GIF, PNG, TIFF, TIF, PDF'}</p>
                            <p>{t('maxFileSize' as any) || 'Max file size: 5MB'}</p>
                            <p>{t('fileNameEnglishOnly' as any) || 'Filename must be English only'}</p>
                          </div>

                          {formData.invoice.uploadedDocs.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                              {formData.invoice.uploadedDocs.map((f, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm group/fixed animate-in zoom-in-95">
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <FileText className="w-4 h-4 text-dhl-red" />
                                    <div className="truncate text-left">
                                      <p className="truncate">{f.name}</p>
                                      <p className="text-[9px] text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </div>
                                  <button onClick={() => {
                                    const docs = [...formData.invoice.uploadedDocs];
                                    docs.splice(i, 1);
                                    updateSection('invoice', { uploadedDocs: docs });
                                  }} className="p-1 hover:bg-red-50 text-gray-300 hover:text-dhl-red rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: PICKUP */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="card space-y-6">
              <div className="flex items-center gap-3 text-dhl-red border-b border-gray-100 pb-4">
                <Truck className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase tracking-tight">{t('pickupStep')}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateSection('pickup', { required: true })}
                  className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 transition-all border-2 ${formData.pickup.required
                      ? 'border-dhl-yellow bg-yellow-50/50 dark:bg-yellow-900/10 shadow-lg shadow-yellow-500/10'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                >
                  <div className={`p-4 rounded-full transition-colors ${formData.pickup.required ? 'bg-dhl-yellow text-dhl-red' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                    <Truck className="w-8 h-8" />
                  </div>
                  <span className={`font-bold text-lg uppercase tracking-tight ${formData.pickup.required ? 'text-dhl-red' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t('pickupYes' as any) || 'Schedule a Pickup'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSection('pickup', { required: false })}
                  className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 transition-all border-2 ${!formData.pickup.required
                      ? 'border-dhl-yellow bg-yellow-50/50 dark:bg-yellow-900/10 shadow-lg shadow-yellow-500/10'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                >
                  <div className={`p-4 rounded-full transition-colors ${!formData.pickup.required ? 'bg-dhl-yellow text-dhl-red' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                    <XCircle className="w-8 h-8" />
                  </div>
                  <span className={`font-bold text-lg uppercase tracking-tight ${!formData.pickup.required ? 'text-dhl-red' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t('pickupNo' as any) || 'Drop off at Service Point'}
                  </span>
                </button>
              </div>

              {formData.pickup.required ? (
                <div className="space-y-12 animate-in fade-in duration-300 pt-4">
                  {/* 1. Date */}
                  <div className="md:w-1/2 space-y-6">
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">
                      <Clock className="w-5 h-5 text-dhl-red" /> {t('pickupSendingOn' as any) || "Schedule a Pickup"}
                    </h4>
                    <Input
                      label={t('pickupSendingOn' as any) || "Pickup Date"}
                      type="date"
                      value={formData.shipDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={v => setFormData({ ...formData, shipDate: v })}
                    />
                  </div>

                  {/* 2. Window Slider — native noUiSlider */}
                  <PickupWindowSlider
                    key={formData.shipDate}
                    readyTime={formData.pickup.readyTime}
                    closeTime={formData.pickup.closeTime}
                    shipDate={formData.shipDate}
                    formatTime={formatTime}
                    toMinutes={toMinutes}
                    toTimeString={toTimeString}
                    getMinReadyTime={getMinReadyTime}
                    onChange={(ready: string, close: string) => {
                      updateSection('pickup', { readyTime: ready, closeTime: close });
                    }}
                    hintText={t('pickupWindowHint' as any) || "Please allow at least 90 minutes for your Pickup Window"}
                    label={t('pickupWindow' as any) || "Pickup Window"}
                  />

                  {/* 3. Location */}
                  <div className="md:w-1/2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('pickupLocation' as any) || "Pickup Location"}</label>
                    <select
                      value={formData.pickup.location}
                      onChange={e => updateSection('pickup', { location: e.target.value })}
                      className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 font-bold focus:ring-2 focus:ring-dhl-yellow outline-none"
                    >
                      {pickupLocations.map((l: string) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  {/* 4. Total Weight & Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label={t('pickupTotalWeight' as any) || "Total Weight"} value={formData.shipMethod === 'package' ? `${totalPackageWeight.toFixed(3)} KG` : `${totalInvoiceWeight.toFixed(3)} KG`} disabled />
                    <Input label={t('pickupInstructions' as any) || "Instructions for the courier"} value={formData.pickup.instructions} onChange={v => updateSection('pickup', { instructions: v })} ruleKey="pickupInstructions" />
                  </div>

                  {/* 5. Pickup Address Section */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 transition-colors">
                    <div className="flex justify-between items-start sm:items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-4 gap-4 flex-wrap sm:flex-nowrap">
                      <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight flex items-start sm:items-center gap-2 break-words min-w-0 flex-1">
                        <MapPin className="w-5 h-5 text-dhl-red flex-shrink-0 mt-0.5 sm:mt-0" /> 
                        <span className="break-words">{t('pickupAddress' as any) || "Pickup Address"}</span>
                      </h4>
                      {!isEditingPickupAddress ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTempPickupAddress(formData.pickup.address);
                            setIsEditingPickupAddress(true);
                          }}
                          className="text-xs font-black text-dhl-red uppercase hover:text-dhl-yellow transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> {t('editAddress' as any) || "Edit"}
                        </button>
                      ) : (
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              updateSection('pickup', { address: tempPickupAddress });
                              setIsEditingPickupAddress(false);
                            }}
                            className="text-xs font-black text-green-600 uppercase hover:text-green-700 font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingPickupAddress(false)}
                            className="text-xs font-black text-gray-400 uppercase hover:text-gray-500 font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingPickupAddress ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                        <Input label="Name" value={tempPickupAddress.name} onChange={v => setTempPickupAddress({ ...tempPickupAddress, name: v })} required />
                        <Input label="Company" value={tempPickupAddress.company} onChange={v => setTempPickupAddress({ ...tempPickupAddress, company: v })} required />
                        <div className="sm:col-span-2">
                          <Input label="Address 1" value={tempPickupAddress.address1} onChange={v => setTempPickupAddress({ ...tempPickupAddress, address1: v })} required />
                        </div>
                        <Input label="Address 2" value={tempPickupAddress.address2} onChange={v => setTempPickupAddress({ ...tempPickupAddress, address2: v })} />
                        <Input label="Address 3" value={tempPickupAddress.address3} onChange={v => setTempPickupAddress({ ...tempPickupAddress, address3: v })} />
                        <div className="sm:col-span-2 relative">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={pickupSuggestionsRef}>
                            <Input label="City" value={tempPickupAddress.city} onChange={v => { setTempPickupAddress({ ...tempPickupAddress, city: v }); fetchPickupSuggestions(v, 'city', tempPickupAddress.country); }} onBlur={validatePickupAddress} required ruleKey="city" />
                            <Input label="Postal Code" value={tempPickupAddress.postalCode} onChange={v => { setTempPickupAddress({ ...tempPickupAddress, postalCode: v }); fetchPickupSuggestions(v, 'postalCode', tempPickupAddress.country); }} onBlur={validatePickupAddress} required ruleKey="postalcode" />
                          </div>

                          {pickupValidationWarning && (
                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-dhl-yellow rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
                              <AlertCircle className="w-5 h-5 text-dhl-yellow flex-shrink-0 mt-0.5" />
                              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{pickupValidationWarning}</p>
                            </div>
                          )}

                          {showPickupSuggestions && pickupSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                {pickupSuggestions.map((loc, i) => {
                                  const pCode = loc.postalCode || '';
                                  const cName = loc.cityName || loc.city || '';
                                  const sName = loc.cityDistrict || loc.countyName || '';

                                  const displayTextParts = [];
                                  if (pCode) displayTextParts.push(pCode);
                                  if (cName) displayTextParts.push(cName);
                                  if (sName && sName.toLowerCase() !== cName.toLowerCase()) {
                                    displayTextParts.push(`- ${sName}`);
                                  }

                                  const displayText = displayTextParts.join(' ');

                                  return (
                                    <div
                                      key={i}
                                      onClick={() => handlePickupSuggestionSelect(loc)}
                                      className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-all border-b border-gray-50 dark:border-gray-800 last:border-0"
                                    >
                                      <p className="font-bold text-sm text-gray-900 dark:text-white">{displayText}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <Input label="Phone" value={tempPickupAddress.phone} onChange={v => setTempPickupAddress({ ...tempPickupAddress, phone: v })} required ruleKey="phone" />
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in duration-300 py-2">
                        <p className="font-black italic text-gray-900 dark:text-white text-lg uppercase tracking-tight break-words">
                          {formData.pickup.address.name}, {formData.pickup.address.company}
                        </p>
                        <p className="text-sm font-bold text-gray-500 leading-relaxed break-words">
                          {formData.pickup.address.address1}
                          {formData.pickup.address.address2 && <>, {formData.pickup.address.address2}</>}
                          {formData.pickup.address.address3 && <>, {formData.pickup.address.address3}</>}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-widest uppercase break-words">
                          {formData.pickup.address.city}, {formData.pickup.address.postalCode}
                        </p>
                        <p className="text-sm font-black text-dhl-red italic">
                          Tel: {formData.pickup.address.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed hover:border-gray-200 transition-colors">
                  <a href="https://www.dhl.com/discover/th-th/contact-us" target="_blank" rel="noopener noreferrer" className="text-dhl-red hover:text-dhl-yellow font-black uppercase tracking-widest text-lg transition-colors underline block w-full h-full">
                    {t('pickupDropOffLink' as any) || "Find a drop-off location"}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: SUMMARY */}
        {currentStep === 7 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="card space-y-6 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-dhl-red" /> {t('summary')}
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-black text-dhl-red uppercase hover:underline italic"
                >
                  {t('editShipment' as any) || 'Edit'}
                </button>
              </div>

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipper Summary */}
                  <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3" data-i18n="summaryShipper">{t('summaryShipper' as any) || t('shipperInfo' as any)}</h4>
                    <div className="space-y-1 font-bold text-gray-700 dark:text-gray-300">
                      <p className="break-words font-black text-gray-900 dark:text-white text-base">
                        {formData.shipper.name}, {formData.shipper.company}
                      </p>
                      <p className="break-words">
                        {[formData.shipper.address1, formData.shipper.address2, formData.shipper.address3].filter(Boolean).join(', ')}
                      </p>
                      <p className="break-words">
                        {formData.shipper.city}, {formData.shipper.postalCode}, {countries.find(c => c.countryCode === formData.shipper.country)?.countryName || formData.shipper.country}
                      </p>
                      <p className="break-words mt-2 text-dhl-red italic">
                        <strong>Tel:</strong> {formData.shipper.phone}
                      </p>
                    </div>
                  </div>

                  {/* Receiver Summary */}
                  <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3" data-i18n="summaryReceiver">{t('summaryReceiver' as any) || t('receiverInfo' as any)}</h4>
                    <div className="space-y-1 font-bold text-gray-700 dark:text-gray-300">
                      <p className="break-words font-black text-gray-900 dark:text-white text-base">
                        {formData.receiver.name}, {formData.receiver.company}
                      </p>
                      <p className="break-words">
                        {[formData.receiver.address1, formData.receiver.suburb, formData.receiver.address2, formData.receiver.address3].filter(Boolean).join(', ')}
                      </p>
                      <p className="break-words">
                        {formData.receiver.city}, {formData.receiver.postalCode}, {countries.find(c => c.countryCode === formData.receiver.country)?.countryName || formData.receiver.country}
                      </p>
                      <p className="break-words mt-2 text-dhl-red italic">
                        <strong>Tel:</strong> {formData.receiver.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3" data-i18n="summaryShipmentInfo">{t('summaryShipmentInfo' as any) || "Shipment Details"}</h4>
                  <div className="space-y-2 font-bold text-gray-700 dark:text-gray-300">
                    <p className="break-words"><strong>{t('shipmentDate' as any)}:</strong> {new Date(formData.shipDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="break-words"><strong>Type:</strong> {formData.shipMethod === 'document' ? t('document' as any) : t('package' as any)}</p>
                    <p className="break-words"><strong>Reference:</strong> {formData.shipmentReference || 'N/A'}</p>

                    {formData.shipMethod === 'document' ? (
                      <>
                        <p className="break-words"><strong>Description:</strong> {formData.documentDescription || 'Documents'}</p>
                        {formData.insurance?.required && (
                          <p className="break-words"><strong>Insurance:</strong> Extended Liability</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="break-words"><strong>Insurance:</strong> {formData.insurance?.required ? `${formData.insurance.value} THB` : 'No'}</p>
                        <div className="mt-4 space-y-4">
                          {formData.invoice.items.map((it, idx) => (
                            <div key={idx} className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <p className="font-black text-xs text-gray-400 uppercase tracking-tighter mb-1">Item #{idx + 1}</p>
                              <p className="break-words text-gray-900 dark:text-white font-black italic uppercase">
                                {it.description || 'Item'}
                              </p>
                              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                <span>Qty: {it.quantity}</span>
                                <span>Weight: {it.weight.toFixed(3)} KG</span>
                                <span className="text-dhl-red">Value: {it.value.toLocaleString()} THB</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Package Info */}
                  <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3" data-i18n="summaryPackageInfo">{t('summaryPackageInfo' as any) || "Package Information"}</h4>
                    <div className="space-y-1 font-bold text-gray-700 dark:text-gray-300">
                      <p className="break-words"><strong>{t('totalPackages' as any)}:</strong> {formData.packages.reduce((s, p) => s + p.quantity, 0)}</p>
                      <p className="break-words"><strong>{t('totalWeightKg' as any)}:</strong> {totalPackageWeight.toFixed(3)} KG</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3" data-i18n="summaryPaymentInfo">{t('summaryPaymentInfo' as any) || "Payment Information"}</h4>
                    <div className="space-y-1 font-bold text-gray-700 dark:text-gray-300">
                      <p className="break-words"><strong>{t('shipperAccount' as any)}:</strong> {formData.payment.shipperAccount}</p>
                      <p className="break-words"><strong>{t('billingAccount' as any)}:</strong> {formData.payment.useShipperForBilling ? formData.payment.shipperAccount : (formData.payment.billingAccount || 'N/A')}</p>
                      {formData.shipMethod === 'package' && (
                        <>
                          <p className="break-words"><strong>{t('dutiesAccount' as any)}:</strong> {formData.payment.dutiesRole === 'receiver' ? t('receiverWillPay' as any) : (formData.payment.dutiesAccount || 'N/A')}</p>
                          <p className="break-words"><strong>{t('incoterm' as any)}:</strong> {formData.payment.incoterm}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pickup Info */}
                {formData.pickup.required && (
                  <div className="p-4 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3" data-i18n="summaryPickupInfo">{t('summaryPickupInfo' as any) || "Pickup Information"}</h4>
                    <div className="space-y-1 font-bold text-gray-700 dark:text-gray-300">
                      <p className="break-words"><strong>{t('requestPickup' as any)}:</strong> {t('yes' as any)}</p>
                      <p className="break-words"><strong>{t('summaryPickupDate' as any)}:</strong> {new Date(formData.shipDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="break-words"><strong>{t('summaryPickupTime' as any)}:</strong> {formatTime(toMinutes(formData.pickup.readyTime))} - {formatTime(toMinutes(formData.pickup.closeTime))}</p>
                      <p className="break-words"><strong>{t('pickupLocationQuestion' as any)}:</strong> {formData.pickup.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Print Size Selection - Exact Parity with ship.html print-options-container */}
              <div className="p-6 border-2 border-dhl-yellow/30 rounded-3xl bg-dhl-yellow/10 dark:bg-gray-800/10 space-y-6 shadow-inner">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2" data-i18n="selectPrintSize">
                  <Printer className="w-6 h-6 text-dhl-red" /> {t('selectPrintSize' as any) || "กรุณาเลือกขนาดในการปริ้น"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPrintSize('A4')}
                    className={`p-5 rounded-2xl flex flex-col items-center justify-center text-center transition-all border-2 border-dashed ${printSize === 'A4' ? 'bg-white border-dhl-red shadow-xl shadow-red-500/10 scale-[1.02]' : 'bg-white/50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 hover:border-gray-300'}`}
                  >
                    <div className="w-10 h-14 border-2 border-gray-300 rounded shadow-sm flex items-center justify-center bg-gray-50 mb-3">
                      <span className="text-gray-400 font-bold text-[8px]">A4</span>
                    </div>
                    <span className="font-black tracking-tight uppercase text-sm" data-i18n="printA4">{t('printA4' as any) || "ขนาด A4"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintSize('Label')}
                    className={`p-5 rounded-2xl flex flex-col items-center justify-center text-center transition-all border-2 border-dashed ${printSize === 'Label' ? 'bg-white border-dhl-red shadow-xl shadow-red-500/10 scale-[1.02]' : 'bg-white/50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 hover:border-gray-300'}`}
                  >
                    <div className="w-10 h-16 border-2 border-gray-300 rounded shadow-sm flex items-center justify-center bg-gray-50 mb-3">
                      <span className="text-gray-400 font-bold text-[8px]">8x4"</span>
                    </div>
                    <span className="font-black tracking-tight uppercase text-sm" data-i18n="printLabel">{t('printLabel' as any) || "ขนาด Label 8x4 Inch"}</span>
                  </button>
                </div>
                {showValidationErrors && !printSize && (
                  <p className="text-center text-xs font-black text-dhl-red italic animate-bounce uppercase tracking-widest">{t('selectPrintSizeError' as any) || "Please select a print size before creating the shipment"}</p>
                )}
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-3xl border-2 border-red-100 dark:border-red-900/30 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-dhl-red rounded-2xl text-white shadow-xl shadow-red-500/20 animate-pulse text-center">
                  <AlertCircle className="w-10 h-10 mx-auto" />
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
          disabled={isSubmitting || (currentStep === 6 && isEditingPickupAddress)}
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
