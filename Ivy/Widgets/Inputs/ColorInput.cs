using Ivy.Core;
using Ivy.Core.Helpers;
using Ivy.Core.Hooks;
using Ivy.Widgets.Inputs;

// ReSharper disable once CheckNamespace
namespace Ivy;

public interface IAnyColorInput : IAnyInput
{
    public string? Placeholder { get; set; }
}

public abstract record ColorInputBase : WidgetBase<ColorInputBase>, IAnyColorInput
{
    [Prop] public bool Disabled { get; set; }
    [Prop] public string? Invalid { get; set; }
    [Prop] public string? Placeholder { get; set; }
    [Event] public Action<Event<IAnyInput>>? OnBlur { get; set; }
    public Type[] SupportedStateTypes() => [typeof(string)];
}

public record ColorInput<TColor> : ColorInputBase, IInput<TColor>
{
    public ColorInput(IAnyState state, string? placeholder = null, bool disabled = false)
        : this(placeholder, disabled)
    {
        var typedState = state.As<TColor>();
        Value = typedState.Value;
        OnChange = e => typedState.Set(e.Value);
    }

    public ColorInput(TColor value, Action<Event<IInput<TColor>, TColor>>? onChange = null, string? placeholder = null, bool disabled = false)
        : this(placeholder, disabled)
    {
        OnChange = onChange;
        Value = value;
    }

    public ColorInput(string? placeholder = null, bool disabled = false)
    {
        Disabled = disabled;
        Placeholder = placeholder;
    }

    [Prop] public TColor Value { get; } = default!;

    [Event] public Action<Event<IInput<TColor>, TColor>>? OnChange { get; }
}

public static class ColorInputExtensions
{
    public static ColorInputBase ToColorInput(this IAnyState state, string? placeholder = null, bool disabled = false)
    {
        var type = state.GetStateType();
        Type genericType = typeof(ColorInput<>).MakeGenericType(type);
        ColorInputBase input = (ColorInputBase)Activator.CreateInstance(genericType, state, placeholder, disabled)!;
        return input;
    }

    public static ColorInputBase Disabled(this ColorInputBase widget, bool disabled)
    {
        return widget with { Disabled = disabled };
    }

    public static ColorInputBase Placeholder(this ColorInputBase widget, string? placeholder)
    {
        return widget with { Placeholder = placeholder };
    }

    public static ColorInputBase Invalid(this ColorInputBase widget, string? invalid)
    {
        return widget with { Invalid = invalid };
    }
}