import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '../../theme/ThemeContext';
import { ConfirmDialog } from '../ConfirmDialog';

async function mount(visible: boolean) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <ThemeProvider>
        <ConfirmDialog
          visible={visible}
          title="Delete this scan?"
          confirmLabel="Delete"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </ThemeProvider>,
    );
  });
  return { root: renderer!.root, onConfirm, onCancel };
}

// The Pressable that wraps a given label.
function button(root: ReactTestRenderer['root'], label: string) {
  const text = root.findAll(n => n.type === Text && n.props.children === label)[0];
  let node = text.parent;
  while (node && !node.props.onPress) node = node.parent;
  return node!;
}

describe('ConfirmDialog', () => {
  it('renders nothing when hidden', async () => {
    const { root } = await mount(false);
    expect(root.findAllByType(Text)).toHaveLength(0);
  });

  it('calls onConfirm from the confirm button', async () => {
    const { root, onConfirm, onCancel } = await mount(true);
    await act(async () => button(root, 'Delete').props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel from the cancel button', async () => {
    const { root, onConfirm, onCancel } = await mount(true);
    await act(async () => button(root, 'Cancel').props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
