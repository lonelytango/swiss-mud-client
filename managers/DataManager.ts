export interface MudData {
  mud_profiles: any[];
  mud_variables: any[];
  mud_aliases: any[];
  mud_triggers: any[];
  mud_settings: {
    highlightInputOnCommand: boolean;
    showCommandInOutput: boolean;
  };
}

export class DataManager {
  static async exportToFile() {
    const data = this.getDataFromStorage();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mud-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async exportToClipboard(): Promise<void> {
    const data = this.getDataFromStorage();
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }

  static async importFromFile(file: File): Promise<MudData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (this.validateData(data)) {
            resolve(data);
          } else {
            reject(new Error('Invalid data format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  static importFromText(text: string): MudData {
    const data = JSON.parse(text);
    if (this.validateData(data)) {
      return data;
    }
    throw new Error('Invalid data format');
  }

  static getDataFromStorage(): MudData {
    return {
      mud_profiles: JSON.parse(localStorage.getItem('mud_profiles') || '[]'),
      mud_variables: JSON.parse(localStorage.getItem('mud_variables') || '[]'),
      mud_aliases: JSON.parse(localStorage.getItem('mud_aliases') || '[]'),
      mud_triggers: JSON.parse(localStorage.getItem('mud_triggers') || '[]'),
      mud_settings: JSON.parse(
        localStorage.getItem('mud_settings') ||
          JSON.stringify({
            highlightInputOnCommand: true,
            showCommandInOutput: true,
          })
      ),
    };
  }

  static saveDataToStorage(data: MudData) {
    localStorage.setItem('mud_profiles', JSON.stringify(data.mud_profiles));
    localStorage.setItem('mud_variables', JSON.stringify(data.mud_variables));
    localStorage.setItem('mud_aliases', JSON.stringify(data.mud_aliases));
    localStorage.setItem('mud_triggers', JSON.stringify(data.mud_triggers));
    localStorage.setItem('mud_settings', JSON.stringify(data.mud_settings));
  }

  private static validateData(data: any): data is MudData {
    return (
      data &&
      Array.isArray(data.mud_profiles) &&
      Array.isArray(data.mud_variables) &&
      Array.isArray(data.mud_aliases) &&
      Array.isArray(data.mud_triggers) &&
      typeof data.mud_settings === 'object' &&
      typeof data.mud_settings.highlightInputOnCommand === 'boolean' &&
      typeof data.mud_settings.showCommandInOutput === 'boolean'
    );
  }
}
