import { useState } from 'react';
import { Field, Button, Icon, IconButton } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function VehicleForm({ editingVehicle, onSaved, onCancel }) {
  const { showToast } = useToast();
  const [name, setName] = useState(editingVehicle?.name || '');
  const [brand, setBrand] = useState(editingVehicle?.brand || '');
  const [model, setModel] = useState(editingVehicle?.model || '');
  const [plate, setPlate] = useState(editingVehicle?.plate || '');
  const [year, setYear] = useState(editingVehicle?.year ?? '');
  const [color, setColor] = useState(editingVehicle?.color || '');
  const [currentOdometer, setCurrentOdometer] = useState(editingVehicle?.currentOdometer ?? 0);
  const [photoUrl, setPhotoUrl] = useState(editingVehicle?.photoUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notes, setNotes] = useState(editingVehicle?.notes || '');
  const [saving, setSaving] = useState(false);

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const result = await api.uploadFile(file);
      setPhotoUrl(result.url);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Dê um nome ao veículo', 'error');
      return;
    }

    const payload = {
      name: trimmedName,
      brand: brand.trim(),
      model: model.trim(),
      plate: plate.trim(),
      year: year === '' ? null : Number(year),
      color: color.trim(),
      currentOdometer: Number(currentOdometer) || 0,
      photoUrl,
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      const vehicle = editingVehicle
        ? await api.updateVehicle(editingVehicle._id, payload)
        : await api.createVehicle(payload);
      showToast(editingVehicle ? 'Veículo atualizado' : 'Veículo cadastrado', 'success');
      onSaved(vehicle);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <Field label="Nome" htmlFor="vehicle-name">
        <input
          id="vehicle-name"
          type="text"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Ducati Panigale V4"
          autoFocus
        />
      </Field>

      <Field label="Foto (opcional)" htmlFor="vehicle-photo">
        {photoUrl && (
          <div className="vehicle-photo-preview">
            <img src={photoUrl} alt={name || 'Foto do veículo'} />
            <IconButton
              type="button"
              title="Remover foto"
              aria-label="Remover foto"
              onClick={() => setPhotoUrl('')}
            >
              <Icon name="trash" />
            </IconButton>
          </div>
        )}
        <input id="vehicle-photo" type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} />
        {uploadingPhoto && <p className="vehicle-photo-uploading">Enviando foto…</p>}
      </Field>

      <div className="vehicle-form-row">
        <Field label="Marca" htmlFor="vehicle-brand">
          <input
            id="vehicle-brand"
            type="text"
            maxLength={60}
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder="Ex: Ducati"
          />
        </Field>
        <Field label="Modelo" htmlFor="vehicle-model">
          <input
            id="vehicle-model"
            type="text"
            maxLength={60}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="Ex: Panigale V4"
          />
        </Field>
      </div>

      <div className="vehicle-form-row">
        <Field label="Placa" htmlFor="vehicle-plate">
          <input
            id="vehicle-plate"
            type="text"
            maxLength={20}
            value={plate}
            onChange={(event) => setPlate(event.target.value)}
            placeholder="ABC-1D23"
          />
        </Field>
        <Field label="Ano" htmlFor="vehicle-year">
          <input
            id="vehicle-year"
            type="number"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder="2024"
          />
        </Field>
      </div>

      <div className="vehicle-form-row">
        <Field label="Cor" htmlFor="vehicle-color">
          <input
            id="vehicle-color"
            type="text"
            maxLength={30}
            value={color}
            onChange={(event) => setColor(event.target.value)}
            placeholder="Ex: Vermelho"
          />
        </Field>
        <Field label="Odômetro atual (km)" htmlFor="vehicle-odometer">
          <input
            id="vehicle-odometer"
            type="number"
            min={0}
            value={currentOdometer}
            onChange={(event) => setCurrentOdometer(event.target.value)}
          />
        </Field>
      </div>

      <Field label="Notas (opcional)" htmlFor="vehicle-notes">
        <textarea
          id="vehicle-notes"
          maxLength={500}
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <div className="vehicle-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {editingVehicle ? 'Salvar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
