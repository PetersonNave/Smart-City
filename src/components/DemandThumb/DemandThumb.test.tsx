import { fireEvent, render, screen } from '@testing-library/react-native';
import { DemandThumb } from './index';

describe('DemandThumb', () => {
  it('shows the demand photo when there is one', () => {
    render(<DemandThumb category="SANITATION" photoUrl="http://api/fotos/a.jpg" testID="thumb" />);

    expect(screen.getByLabelText('Foto da demanda').props.source).toEqual({ uri: 'http://api/fotos/a.jpg' });
  });

  it('falls back to the category icon when the photo fails to load', () => {
    render(<DemandThumb category="SANITATION" photoUrl="http://api/fotos/quebrada.jpg" testID="thumb" />);

    fireEvent(screen.getByTestId('thumb-photo'), 'error');

    expect(screen.queryByLabelText('Foto da demanda')).toBeNull();
  });

  it('shows only the (decorative) category icon without a photo', () => {
    render(<DemandThumb category="SANITATION" photoUrl={null} testID="thumb" />);

    expect(screen.queryByLabelText('Foto da demanda')).toBeNull();
  });
});
