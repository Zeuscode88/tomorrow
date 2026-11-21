import { jsPDF } from 'jspdf';
import { AppIdea } from '../types/app';
import { ProjectBuild } from '../types/builder';

export function getProjectShareUrl(app: AppIdea, renderBuildId?: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin || '';
  const pathname = window.location.pathname || '';
  if (renderBuildId) {
    return `${origin}${pathname}?render=${encodeURIComponent(renderBuildId)}`;
  }
  return `${origin}${pathname}?app=${encodeURIComponent(app.id)}`;
}

export function buildProjectShareText(
  app: AppIdea,
  options: { includeLink?: boolean; renderBuildId?: string; compact?: boolean; builds?: ProjectBuild[] } = {}
): string {
  const { includeLink = true, renderBuildId, compact = false, builds = [] } = options;
  const link = getProjectShareUrl(app, renderBuildId);

  if (compact) {
    const lines = [
      `*${app.title}* (${app.country} · ${app.sector})`,
      app.tagline,
      '',
      `Problème : ${app.problemSolved}`,
      `Impact : ${app.impactPotential}`,
      `Stack : ${app.techStackSuggested.join(', ')}`,
    ];
    if (includeLink && link) {
      lines.push('', `Découvrir sur tomorrow : ${link}`);
    }
    return lines.join('\n');
  }

  const lines: string[] = [
    `========================================`,
    `tomorrow — FICHE PROJET AFRIQUE`,
    `========================================`,
    `Projet : ${app.title}`,
    `Accroche : ${app.tagline}`,
    `Pays : ${app.country} (${app.continent})`,
    `Secteur : ${app.sector}`,
    `Statut : ${app.status} | Difficulté : ${app.difficulty} | Soutiens : ${app.votes} votes`,
    '',
    `1. DESCRIPTION DU CONCEPT`,
    app.description,
    '',
    `2. PROBLÈME TERRAIN IDENTIFIÉ`,
    app.problemSolved,
    '',
    `3. IMPACT ESTIMÉ & PUBLIC CIBLE`,
    `Impact : ${app.impactPotential}`,
    `Public cible : ${app.targetAudience}`,
    '',
    `4. CAHIER DES CHARGES TECHNIQUE (MVP)`,
    ...app.developerBrief.mvpScope.map((item, idx) => `  ${idx + 1}. ${item}`),
    '',
    `Contraintes locales :`,
    ...app.developerBrief.localConstraints.map((c) => `  - ${c}`),
    '',
    `Architecture conseillée : ${app.developerBrief.architecturalTip}`,
    `Modèle économique : ${app.developerBrief.monetization}`,
    `Technologies : ${app.techStackSuggested.join(' · ')}`,
  ];

  if (builds.length > 0) {
    lines.push('', `5. PROTOTYPES & RENDUS COMMUNAUTAIRES (${builds.length})`);
    builds.forEach((b, idx) => {
      const activeVer = b.versions.find((v) => v.id === b.activeVersionId) || b.versions[0];
      const renderLink = getProjectShareUrl(app, b.id);
      lines.push(
        `  ${idx + 1}. ${b.title} (${b.progressStage} - ${b.progressPercent}%) par ${b.ownerName}`,
        `     Version active : ${activeVer?.versionTag || 'v0.1.0'} | Équipe : ${b.members.length} membre(s)`,
        `     Lien rendu public : ${renderLink}`
      );
      if (b.githubUrl) lines.push(`     GitHub : ${b.githubUrl}`);
    });
  }

  if (includeLink && link) {
    lines.push('', `Lien direct : ${link}`);
  }

  return lines.join('\n');
}

export function downloadProjectText(app: AppIdea, builds: ProjectBuild[] = []): void {
  const content = buildProjectShareText(app, { includeLink: true, compact: false, builds });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = app.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'projet'}-tomorrow-fiche.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProjectToPdf(app: AppIdea, builds: ProjectBuild[] = []): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (neededHeight = 14) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  const addWrappedText = (text: string, fontSize: number, color: [number, number, number], bold = false, lineHeight = 5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text || '', maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeight + 2);
      doc.text(line, margin, y);
      y += lineHeight;
    }
  };

  const addSectionHeading = (title: string) => {
    ensureSpace(14);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    addWrappedText(title, 11, [15, 23, 42], true, 6);
    y += 1;
  };

  // Top Header Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('tomorrow', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("L'App Store des applications qui manquent à l'Afrique · Fiche Projet", margin, 20);
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, 13, { align: 'right' });

  y = 38;

  // Metadata line
  addWrappedText(
    `${app.country} (${app.continent})  ·  ${app.sector}  ·  ${app.status}  ·  ${app.votes} votes`,
    9,
    [71, 85, 105],
    true,
    5
  );
  y += 2;

  // Title & Tagline
  addWrappedText(app.title, 20, [15, 23, 42], true, 8);
  y += 1;
  addWrappedText(app.tagline, 11, [51, 65, 85], false, 5.5);

  // Concept
  addSectionHeading('01. Concept & Contexte');
  addWrappedText(app.description, 10, [51, 65, 85], false, 5);
  y += 2;
  addWrappedText(`Public cible : ${app.targetAudience}`, 9.5, [15, 23, 42], true, 5);

  // Problem & Impact
  addSectionHeading('02. Problème terrain & Impact estimé');
  addWrappedText('Problème identifié :', 9.5, [185, 28, 28], true, 5);
  addWrappedText(app.problemSolved, 9.5, [51, 65, 85], false, 5);
  y += 2;
  addWrappedText('Impact potentiel :', 9.5, [4, 120, 87], true, 5);
  addWrappedText(app.impactPotential, 9.5, [51, 65, 85], false, 5);

  // Technical Spec
  addSectionHeading(`03. Cahier des charges technique (Difficulté : ${app.difficulty})`);
  addWrappedText('Périmètre MVP recommandé :', 9.5, [15, 23, 42], true, 5);
  app.developerBrief.mvpScope.forEach((step, idx) => {
    addWrappedText(`${idx + 1}. ${step}`, 9.5, [51, 65, 85], false, 5);
  });

  y += 2;
  addWrappedText('Contraintes terrain locales :', 9.5, [180, 83, 9], true, 5);
  app.developerBrief.localConstraints.forEach((c) => {
    addWrappedText(`• ${c}`, 9.5, [51, 65, 85], false, 5);
  });

  y += 2;
  addWrappedText(`Architecture conseillée : ${app.developerBrief.architecturalTip}`, 9.5, [51, 65, 85], false, 5);
  addWrappedText(`Modèle économique : ${app.developerBrief.monetization}`, 9.5, [51, 65, 85], false, 5);
  addWrappedText(`Technologies conseillées : ${app.techStackSuggested.join(' · ')}`, 9.5, [15, 23, 42], true, 5);

  // Builds & Public Renders
  if (builds.length > 0) {
    addSectionHeading(`04. Prototypes & Équipes mobilisées (${builds.length})`);
    builds.forEach((b, idx) => {
      const activeVer = b.versions.find((v) => v.id === b.activeVersionId) || b.versions[0];
      addWrappedText(
        `${idx + 1}. ${b.title} — ${b.progressStage} (${b.progressPercent}%) · Version ${activeVer?.versionTag || 'v0.1.0'}`,
        9.5,
        [15, 23, 42],
        true,
        5
      );
      if (b.summary) {
        addWrappedText(b.summary, 9, [71, 85, 105], false, 4.5);
      }
      if (b.githubUrl) {
        addWrappedText(`GitHub : ${b.githubUrl}`, 8.5, [51, 65, 85], false, 4.5);
      }
      addWrappedText(`Rendu public : ${getProjectShareUrl(app, b.id)}`, 8.5, [51, 65, 85], false, 4.5);
      y += 2;
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  const projectUrl = getProjectShareUrl(app);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`tomorrow · ${projectUrl}`, margin, pageHeight - 9);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }

  const slug = app.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  doc.save(`${slug || 'projet'}-tomorrow-fiche.pdf`);
}

export function getWhatsAppShareUrl(app: AppIdea, renderBuildId?: string): string {
  const text = buildProjectShareText(app, { includeLink: true, compact: true, renderBuildId });
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getTelegramShareUrl(app: AppIdea, renderBuildId?: string): string {
  const url = getProjectShareUrl(app, renderBuildId);
  const text = `${app.title} (${app.country}) — ${app.tagline}\n${app.problemSolved}`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getMessengerShareUrl(app: AppIdea, renderBuildId?: string): string {
  const url = getProjectShareUrl(app, renderBuildId);
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(url)}`;
}
