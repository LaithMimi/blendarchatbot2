
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface PreferencesPopupProps {
  onSave: (preferences: UserPreferences) => void;
  isOpen: boolean;
}

export interface UserPreferences {
  name: string;
  level: string;
  week: string;
  gender: string;
  language: string;
}

const PreferencesPopup: React.FC<PreferencesPopupProps> = ({ onSave, isOpen }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    level: 'beginner',
    week: 'week01',
    gender: 'male',
    language: 'english'
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load saved preferences from localStorage if available
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSelectChange = (value: string, field: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Determine API base URL
      const apiBaseUrl = import.meta.env.PROD 
        ? '/api' 
        : 'http://192.168.241.1:8888';
      
      // Send updated preferences to backend
      console.log("Sending preferences update to backend:", preferences);
      const response = await axios.post(`${apiBaseUrl}/update-preferences`, {
        userId: btoa(encodeURIComponent(preferences.name)),
        userName: preferences.name,
        level: preferences.level,
        week: preferences.week,
        gender: preferences.gender,
        language: preferences.language
      });
      
      console.log("Backend preferences update response:", response.data);
      
      // Show success toast
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully.",
      });
      
      // Call the onSave callback
      onSave(preferences);
      
      // Add page refresh after a short delay to allow the toast to be visible
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating preferences:", error);
      
      // Show error toast but still save locally
      toast({
        title: "Warning",
        description: "Preferences saved locally, but couldn't update the backend.",
        variant: "destructive"
      });
      
      // Still call onSave since we saved to localStorage
      onSave(preferences);
      
      // Still refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onSave(preferences);
    }}>
      <DialogContent className="sm:max-w-md backdrop-blur-lg bg-white/90 dark:bg-brand-darkGray/90 border border-brand-bordeaux/20 shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-alef text-2xl font-bold text-brand-darkGray dark:text-white flex items-center">
            <span className="bg-brand-bordeaux text-white p-1 rounded-md mr-2">
              {preferences.name.charAt(0) || '?'}
            </span>
            User Preferences
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-brand-darkGray dark:text-white/90">
              Your Name
            </Label>
            <Input 
              type="text" 
              id="name" 
              name="name"
              className="glass-input focus:ring-2 focus:ring-brand-yellow/30" 
              placeholder="Enter your name" 
              value={preferences.name}
              onChange={handleInputChange}
              autoComplete="name"
            />
          </div>

          {/* Proficiency Level */}
          <div className="space-y-2">
            <Label htmlFor="level" className="text-brand-darkGray dark:text-white/90">
              Arabic Proficiency Level
            </Label>
            <Select 
              value={preferences.level} 
              onValueChange={(value) => handleSelectChange(value, 'level')}
            >
              <SelectTrigger id="level" name="level" className="glass-input">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-brand-darkGray/90 backdrop-blur-md border-brand-bordeaux/20">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Week */}
          <div className="space-y-2">
            <Label htmlFor="week" className="text-brand-darkGray dark:text-white/90">
              Week
            </Label>
            <Select 
              value={preferences.week} 
              onValueChange={(value) => handleSelectChange(value, 'week')}
            >
              <SelectTrigger id="week" name="week" className="glass-input">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-brand-darkGray/90 backdrop-blur-md border-brand-bordeaux/20">
                <SelectItem value="week01">Week 01</SelectItem>
                <SelectItem value="week02">Week 02</SelectItem>
                <SelectItem value="week03">Week 03</SelectItem>
                <SelectItem value="week04">Week 04</SelectItem>
                <SelectItem value="week05">Week 05</SelectItem>
                <SelectItem value="week06">Week 06</SelectItem>
                <SelectItem value="week07">Week 07</SelectItem>
                <SelectItem value="week08">Week 08</SelectItem>
                <SelectItem value="week09">Week 09</SelectItem>
                <SelectItem value="week10">Week 10</SelectItem>
                <SelectItem value="week11">Week 11</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-brand-darkGray dark:text-white/90">
              Gender
            </Label>
            <Select 
              value={preferences.gender} 
              onValueChange={(value) => handleSelectChange(value, 'gender')}
            >
              <SelectTrigger id="gender" name="gender" className="glass-input">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-brand-darkGray/90 backdrop-blur-md border-brand-bordeaux/20">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language" className="text-brand-darkGray dark:text-white/90">
              Language
            </Label>
            <Select 
              value={preferences.language} 
              onValueChange={(value) => handleSelectChange(value, 'language')}
            >
              <SelectTrigger id="language" name="language" className="glass-input">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-brand-darkGray/90 backdrop-blur-md border-brand-bordeaux/20">
                <SelectItem value="arabic">العربية</SelectItem>
                <SelectItem value="hebrew">תמלול</SelectItem>
                <SelectItem value="english">Transliteration English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onSave(preferences)}
            className="border-brand-bordeaux/20 text-brand-darkGray dark:text-white hover:bg-brand-bordeaux/10"
          >
            <XIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-brand-bordeaux hover:bg-brand-bordeaux/90 text-white"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesPopup;
