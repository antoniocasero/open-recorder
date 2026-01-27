/**
 * Editor UI state model for persistence across app sessions.
 */

export interface EditorUiState {
  /** Whether the left sidebar (library panel) is collapsed */
  leftSidebarCollapsed: boolean;
  /** Whether the right sidebar (export panel) is collapsed */
  rightSidebarCollapsed: boolean;
  /** Current search query in the editor search bar */
  searchQuery: string;
  /** Selected export format for transcript export */
  exportFormat: 'txt' | 'srt' | 'vtt' | 'json';
}

/** Default editor UI state (sidebars expanded, empty search, txt export). */
export const DEFAULT_EDITOR_STATE: EditorUiState = {
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  searchQuery: '',
  exportFormat: 'txt',
};