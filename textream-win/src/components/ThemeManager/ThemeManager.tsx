import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { applyTheme, defaultDarkTheme } from "@/lib/theme";
import { Download, Palette, RefreshCcw } from "lucide-react";

export function ThemeManager() {
  const [url, setUrl] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.cssVars) {
          applyTheme(json);
        } else {
          alert("Invalid theme file format.");
        }
      } catch (err) {
        console.error("Theme parse error", err);
        alert("Failed to parse theme file.");
      }
    };
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.cssVars) {
        applyTheme(json);
      } else {
        alert("Invalid theme format from URL.");
      }
    } catch (err) {
      console.error("Fetch error", err);
      alert("Failed to fetch theme.");
    }
  };

  const resetTheme = () => {
    applyTheme(defaultDarkTheme);
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Manager
        </CardTitle>
        <CardDescription>
          Customize the look and feel by importing themes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import from File */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="theme-file">Import from JSON File</Label>
          <Input
            id="theme-file"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="cursor-pointer"
          />
        </div>

        {/* Import from URL */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="theme-url">Import from URL</Label>
          <div className="flex gap-2">
            <Input
              id="theme-url"
              type="url"
              placeholder="https://example.com/theme.json"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={handleUrlImport} variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Load
            </Button>
          </div>
        </div>

        {/* Reset */}
        <div className="pt-2">
          <Button onClick={resetTheme} variant="outline" className="w-full">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
