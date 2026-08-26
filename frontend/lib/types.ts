export type AnalyzeResult = {
  scan_id: string;
  captured_at: string;
  hemoglobin_g_dL: number;
  uncertainty_g_dL: number;
  status: string;
  who: {
    sex: string;
    anemia: boolean;
    cutoff_g_dL: number;
    severity: string;
  };
  quality: {
    score: number;
    grade: string;
    flags: string[];
    glare_pct: number;
    mean_luminance: number;
    roi_px: number;
  };
  metrics: {
    cielab_a_star: number;
    cielab_L: number;
    cielab_b_star: number;
    erythema_index: number;
    opencv_a_channel: number;
  };
  pipeline: string[];
  model: {
    backbone: string;
    loaded: boolean;
    forward_pass: boolean;
    clinical_source: string;
  };
};
